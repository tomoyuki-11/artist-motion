use axum::{
    body::Body,
    extract::State,
    http::{header, Request, StatusCode},
    middleware::{self, Next},
    response::IntoResponse,
    routing::{delete, get, post, put},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use sqlx::sqlite::{SqliteConnectOptions, SqlitePool};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};

mod auth;
mod handlers;

use auth::{admin_claims, create_token};
use handlers::*;

#[derive(Clone)]
pub(crate) struct AppState {
    pub(crate) pool: SqlitePool,
    pub(crate) upload_dir: PathBuf,
    pub(crate) jwt_secret: Vec<u8>,
}

#[derive(Deserialize)]
struct LoginBody {
    password: String,
}

#[derive(Serialize)]
struct LoginResponse {
    token: String,
}

async fn run_migrations(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    for sql in [
        include_str!("../migrations/001_init.sql"),
        include_str!("../migrations/002_news_comments.sql"),
    ] {
        for stmt in sql.split(';').filter(|s| !s.trim().is_empty()) {
            sqlx::query(stmt).execute(pool).await?;
        }
    }
    Ok(())
}

/// 本番でコメントAPIが入ったバイナリかどうか確認用（GET /api/health → 200 かつ news_comments: true なら新API）
async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "ok": true, "news_comments": true }))
}

async fn admin_login(
    State(state): State<Arc<AppState>>,
    Json(body): Json<LoginBody>,
) -> Result<Json<LoginResponse>, (StatusCode, &'static str)> {
    let expected = std::env::var("ADMIN_PASSWORD").unwrap_or_else(|_| "admin".to_string());
    if body.password != expected {
        return Err((StatusCode::UNAUTHORIZED, "Invalid password"));
    }
    let token = create_token(&state.jwt_secret)?;
    Ok(Json(LoginResponse { token }))
}

async fn auth_middleware(
    State(state): State<Arc<AppState>>,
    request: Request<Body>,
    next: Next,
) -> Result<impl IntoResponse, (StatusCode, &'static str)> {
    let auth = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "));
    let Some(token) = auth else {
        return Err((StatusCode::UNAUTHORIZED, "Missing or invalid Authorization"));
    };
    let _claims = admin_claims(token, &state.jwt_secret)?;
    Ok(next.run(request).await)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();

    let cwd = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let db_path: PathBuf = match std::env::var("DATABASE_URL") {
        Ok(url) => {
            let raw = url.trim_start_matches("sqlite:");
            let p = Path::new(raw);
            if p.is_absolute() {
                p.to_path_buf()
            } else {
                cwd.join(p)
            }
        }
        Err(_) => cwd.join("data").join("data.db"),
    };

    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    eprintln!("Database: {}", db_path.display());

    let sqlite_opts = SqliteConnectOptions::new()
        .filename(&db_path)
        .create_if_missing(true);
    let pool = SqlitePool::connect_with(sqlite_opts).await?;

    let jwt_secret = std::env::var("JWT_SECRET")
        .unwrap_or_else(|_| "change-me-in-production".to_string());
    let upload_dir = std::env::var("UPLOAD_DIR").unwrap_or_else(|_| "uploads".to_string());
    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(3002);

    std::fs::create_dir_all(&upload_dir)?;
    let upload_path = PathBuf::from(&upload_dir);
    run_migrations(&pool).await?;

    let state = Arc::new(AppState {
        pool,
        upload_dir: upload_path,
        jwt_secret: jwt_secret.into_bytes(),
    });

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers([header::AUTHORIZATION, header::CONTENT_TYPE]);

    // コメント API: /api/news/:id/comments が 404 になるため /api/news-comments/:id で提供（:id = news_id）
    let public = Router::new()
        .route("/api/health", get(health))
        .route("/api/news", get(list_news))
        .route("/api/news-comments/:id", get(handlers::list_news_comments))
        .route("/api/news-comments/:id", post(handlers::create_news_comment))
        .route("/api/visits", get(get_visits))
        .route("/api/visits", post(increment_visits))
        .route("/api/admin/login", post(admin_login))
        .route("/api/contact", post(handlers::submit_contact));

    let uploads_route = Router::new()
        .route("/uploads/:filename", get(serve_upload))
        .with_state(state.clone());

    let protected = Router::new()
        .route("/api/news", post(create_news))
        .route("/api/news/:id", put(update_news))
        .route("/api/news/:id", delete(delete_news))
        .route_layer(middleware::from_fn_with_state(
            state.clone(),
            auth_middleware,
        ))
        .with_state(state.clone());

    let app = Router::new()
        .merge(public)
        .merge(protected)
        .merge(uploads_route)
        .layer(cors)
        .with_state(state);

    let addr = std::net::SocketAddr::from(([0, 0, 0, 0], port));
    println!("API listening on http://{}", addr);
    axum::serve(
        tokio::net::TcpListener::bind(addr).await?,
        app,
    )
    .await?;
    Ok(())
}

use axum::{
    extract::{Multipart, Path, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    Json,
};
use lettre::{
    message::header::ContentType,
    message::Mailbox,
    transport::smtp::AsyncSmtpTransport,
    AsyncTransport, Message, Tokio1Executor,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::AppState;

const CONTACT_TO: &str = "fuburyukodokai@gmail.com";

#[derive(Serialize)]
pub struct NewsItem {
    id: String,
    title: String,
    image_url: Option<String>,
    body: String,
    created_at: String,
}

#[derive(Serialize)]
pub struct NewsCommentItem {
    id: String,
    news_id: String,
    author_name: String,
    body: String,
    created_at: String,
}

#[derive(Deserialize)]
pub struct CreateCommentBody {
    pub author_name: Option<String>,
    pub body: Option<String>,
}

#[derive(Deserialize)]
pub struct NewsIdPath {
    pub id: String,
}

#[derive(Deserialize)]
pub struct UploadPath {
    pub filename: String,
}

#[derive(Serialize)]
pub struct VisitsResponse {
    count: u64,
}

#[derive(Deserialize)]
pub struct ContactBody {
    pub name: Option<String>,
    pub email: Option<String>,
    pub message: Option<String>,
}

#[derive(Serialize)]
pub struct ContactResponse {
    pub ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

pub async fn submit_contact(
    Json(body): Json<ContactBody>,
) -> Result<Json<ContactResponse>, (StatusCode, Json<ContactResponse>)> {
    let name = body.name.as_deref().unwrap_or("").trim();
    let email = body.email.as_deref().unwrap_or("").trim();
    let message = body.message.as_deref().unwrap_or("").trim();

    if name.is_empty() || email.is_empty() || message.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ContactResponse {
                ok: false,
                error: Some("名前・メールアドレス・お問い合わせ内容は必須です。".to_string()),
            }),
        ));
    }

    let user = match std::env::var("CONTACT_EMAIL_USER") {
        Ok(u) => u.trim().trim_matches('"').to_string(),
        _ => String::new(),
    };
    let pass = match std::env::var("CONTACT_EMAIL_APP_PASSWORD") {
        Ok(p) => p.trim().trim_matches('"').to_string(),
        _ => String::new(),
    };
    if user.is_empty() || pass.is_empty() {
        eprintln!("CONTACT_EMAIL_USER or CONTACT_EMAIL_APP_PASSWORD is not set");
        return Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ContactResponse {
                ok: false,
                error: Some("送信設定が完了していません。".to_string()),
            }),
        ));
    }

    let from_addr = match user.parse::<Mailbox>() {
        Ok(a) => a,
        Err(_) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ContactResponse {
                    ok: false,
                    error: Some("送信設定が不正です。".to_string()),
                }),
            ));
        }
    };
    let to_addr = match CONTACT_TO.parse::<Mailbox>() {
        Ok(a) => a,
        Err(_) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ContactResponse {
                    ok: false,
                    error: Some("送信先の設定が不正です。".to_string()),
                }),
            ));
        }
    };
    let reply_to_addr = match email.parse::<Mailbox>() {
        Ok(a) => a,
        Err(_) => {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(ContactResponse {
                    ok: false,
                    error: Some("メールアドレスの形式が正しくありません。".to_string()),
                }),
            ));
        }
    };

    let text_body = [
        format!("名前: {}", name),
        format!("メールアドレス: {}", email),
        String::new(),
        "お問い合わせ内容:".to_string(),
        message.to_string(),
    ]
    .join("\n");

    let email_msg = match Message::builder()
        .from(from_addr)
        .reply_to(reply_to_addr)
        .to(to_addr)
        .subject(format!("[ARTISTMOTION] お問い合わせ from {}", name))
        .header(ContentType::TEXT_PLAIN)
        .body(text_body)
    {
        Ok(m) => m,
        Err(e) => {
            eprintln!("Contact email build error: {}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ContactResponse {
                    ok: false,
                    error: Some("送信に失敗しました。しばらくしてからお試しください。".to_string()),
                }),
            ));
        }
    };

    let url = format!(
        "smtps://{}:{}@smtp.gmail.com:465",
        urlencoding::encode(&user),
        urlencoding::encode(&pass)
    );
    let mailer: AsyncSmtpTransport<Tokio1Executor> = match AsyncSmtpTransport::<Tokio1Executor>::from_url(&url) {
        Ok(builder) => builder.build(),
        Err(e) => {
            eprintln!("Contact SMTP URL error: {}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ContactResponse {
                    ok: false,
                    error: Some("送信に失敗しました。しばらくしてからお試しください。".to_string()),
                }),
            ));
        }
    };

    if let Err(e) = mailer.send(email_msg).await {
        eprintln!("Contact send error: {}", e);
        return Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ContactResponse {
                ok: false,
                error: Some("送信に失敗しました。しばらくしてからお試しください。".to_string()),
            }),
        ));
    }

    Ok(Json(ContactResponse {
        ok: true,
        error: None,
    }))
}

pub async fn list_news(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<NewsItem>>, (StatusCode, &'static str)> {
    let rows = sqlx::query_as::<_, (String, String, Option<String>, String, String)>(
        "SELECT id, title, image_path, body, created_at FROM news ORDER BY created_at DESC",
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "DB error"))?;

    let base = std::env::var("API_BASE_URL").unwrap_or_else(|_| "http://localhost:3002".to_string());
    let items: Vec<NewsItem> = rows
        .into_iter()
        .map(|(id, title, image_path, body, created_at)| {
            let image_url = image_path.map(|p| format!("{}/uploads/{}", base, p));
            NewsItem {
                id,
                title,
                image_url,
                body,
                created_at,
            }
        })
        .collect();
    Ok(Json(items))
}

pub async fn create_news(
    State(state): State<Arc<AppState>>,
    mut multipart: Multipart,
) -> Result<Json<NewsItem>, (StatusCode, &'static str)> {
    let mut title = String::new();
    let mut body = String::new();
    let mut image_path: Option<String> = None;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid multipart"))?
    {
        let name = field.name().unwrap_or("").to_string();
        if name == "title" {
            title = field
                .text()
                .await
                .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid title"))?
                .trim()
                .to_string();
        } else if name == "body" {
            body = field
                .text()
                .await
                .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid body"))?
                .trim()
                .to_string();
        } else if name == "image" {
            if let Some(content_type) = field.content_type() {
                let ext = content_type
                    .strip_prefix("image/")
                    .unwrap_or("jpg")
                    .split(';')
                    .next()
                    .unwrap_or("jpg");
                let filename = format!("{}.{}", Uuid::new_v4(), ext);
                let path = state.upload_dir.join(&filename);
                let data = field
                    .bytes()
                    .await
                    .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid image"))?;
                tokio::fs::write(&path, &data)
                    .await
                    .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Failed to save image"))?;
                image_path = Some(filename);
            }
        }
    }

    if title.is_empty() || body.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "title and body are required"));
    }

    let id = Uuid::new_v4().to_string();
    let created_at = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();

    sqlx::query(
        "INSERT INTO news (id, title, image_path, body, created_at) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&title)
    .bind(&image_path)
    .bind(&body)
    .bind(&created_at)
    .execute(&state.pool)
    .await
    .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Failed to insert news"))?;

    let base = std::env::var("API_BASE_URL").unwrap_or_else(|_| "http://localhost:3002".to_string());
    let image_url = image_path.map(|p| format!("{}/uploads/{}", base, p));

    Ok(Json(NewsItem {
        id: id.clone(),
        title,
        image_url,
        body,
        created_at,
    }))
}

pub async fn update_news(
    State(state): State<Arc<AppState>>,
    Path(NewsIdPath { id }): Path<NewsIdPath>,
    mut multipart: Multipart,
) -> Result<Json<NewsItem>, (StatusCode, &'static str)> {
    let existing: Option<(String, String, Option<String>, String)> = sqlx::query_as(
        "SELECT id, title, image_path, body FROM news WHERE id = ?",
    )
    .bind(&id)
    .fetch_optional(&state.pool)
    .await
    .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "DB error"))?;

    let (_, mut title, mut image_path, mut body) = existing
        .ok_or((StatusCode::NOT_FOUND, "News not found"))?;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid multipart"))?
    {
        let name = field.name().unwrap_or("").to_string();
        if name == "title" {
            title = field
                .text()
                .await
                .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid title"))?
                .trim()
                .to_string();
        } else if name == "body" {
            body = field
                .text()
                .await
                .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid body"))?
                .trim()
                .to_string();
        } else if name == "image" {
            if field.content_type().is_some() {
                let content_type = field.content_type().unwrap();
                let ext = content_type
                    .strip_prefix("image/")
                    .unwrap_or("jpg")
                    .split(';')
                    .next()
                    .unwrap_or("jpg");
                let filename = format!("{}.{}", Uuid::new_v4(), ext);
                let path = state.upload_dir.join(&filename);
                let data = field
                    .bytes()
                    .await
                    .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid image"))?;
                if !data.is_empty() {
                    tokio::fs::write(&path, &data)
                        .await
                        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Failed to save image"))?;
                    image_path = Some(filename);
                }
            }
        }
    }

    if title.is_empty() || body.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "title and body are required"));
    }

    sqlx::query("UPDATE news SET title = ?, image_path = ?, body = ? WHERE id = ?")
        .bind(&title)
        .bind(&image_path)
        .bind(&body)
        .bind(&id)
        .execute(&state.pool)
        .await
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Failed to update news"))?;

    let created_at: String = sqlx::query_scalar("SELECT created_at FROM news WHERE id = ?")
        .bind(&id)
        .fetch_one(&state.pool)
        .await
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "DB error"))?;

    let base = std::env::var("API_BASE_URL").unwrap_or_else(|_| "http://localhost:3002".to_string());
    let image_url = image_path.map(|p| format!("{}/uploads/{}", base, p));

    Ok(Json(NewsItem {
        id,
        title,
        image_url,
        body,
        created_at,
    }))
}

/// お知らせに紐づくコメント一覧取得（公開）
pub async fn list_news_comments(
    State(state): State<Arc<AppState>>,
    Path(NewsIdPath { id: news_id }): Path<NewsIdPath>,
) -> Result<Json<Vec<NewsCommentItem>>, (StatusCode, &'static str)> {
    let exists: Option<(String,)> = sqlx::query_as("SELECT id FROM news WHERE id = ?")
        .bind(&news_id)
        .fetch_optional(&state.pool)
        .await
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "DB error"))?;
    if exists.is_none() {
        return Err((StatusCode::NOT_FOUND, "News not found"));
    }

    let rows = sqlx::query_as::<_, (String, String, String, String, String)>(
        "SELECT id, news_id, author_name, body, created_at FROM news_comments WHERE news_id = ? ORDER BY created_at ASC",
    )
    .bind(&news_id)
    .fetch_all(&state.pool)
    .await
    .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "DB error"))?;

    let items: Vec<NewsCommentItem> = rows
        .into_iter()
        .map(|(id, news_id, author_name, body, created_at)| NewsCommentItem {
            id,
            news_id,
            author_name,
            body,
            created_at,
        })
        .collect();
    Ok(Json(items))
}

/// お知らせにコメント投稿（訪問者・認証不要）
pub async fn create_news_comment(
    State(state): State<Arc<AppState>>,
    Path(NewsIdPath { id: news_id }): Path<NewsIdPath>,
    Json(body): Json<CreateCommentBody>,
) -> Result<Json<NewsCommentItem>, (StatusCode, Json<serde_json::Value>)> {
    let exists: Option<(String,)> = sqlx::query_as("SELECT id FROM news WHERE id = ?")
        .bind(&news_id)
        .fetch_optional(&state.pool)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": "DB error" })),
            )
        })?;
    if exists.is_none() {
        return Err((
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "News not found" })),
        ));
    }

    let author_name = body
        .author_name
        .as_deref()
        .unwrap_or("")
        .trim()
        .to_string();
    let body_text = body.body.as_deref().unwrap_or("").trim().to_string();

    if author_name.is_empty() || body_text.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "名前とコメント内容は必須です。" })),
        ));
    }

    let id = Uuid::new_v4().to_string();
    let created_at = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();

    sqlx::query(
        "INSERT INTO news_comments (id, news_id, author_name, body, created_at) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&news_id)
    .bind(&author_name)
    .bind(&body_text)
    .bind(&created_at)
    .execute(&state.pool)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": "Failed to save comment" })),
        )
    })?;

    Ok(Json(NewsCommentItem {
        id,
        news_id,
        author_name,
        body: body_text,
        created_at,
    }))
}

pub async fn delete_news(
    State(state): State<Arc<AppState>>,
    Path(NewsIdPath { id }): Path<NewsIdPath>,
) -> Result<StatusCode, (StatusCode, &'static str)> {
    let image_path: Option<String> = sqlx::query_scalar("SELECT image_path FROM news WHERE id = ?")
        .bind(&id)
        .fetch_optional(&state.pool)
        .await
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "DB error"))?;

    sqlx::query("DELETE FROM news WHERE id = ?")
        .bind(&id)
        .execute(&state.pool)
        .await
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Failed to delete news"))?;

    if let Some(filename) = image_path {
        let path = state.upload_dir.join(&filename);
        let _ = tokio::fs::remove_file(&path).await;
    }

    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_visits(
    State(state): State<Arc<AppState>>,
) -> Result<Json<VisitsResponse>, (StatusCode, &'static str)> {
    let row: (i64,) = sqlx::query_as("SELECT count FROM visits WHERE id = 1")
        .fetch_one(&state.pool)
        .await
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "DB error"))?;
    Ok(Json(VisitsResponse {
        count: row.0 as u64,
    }))
}

/// クローラー・ボットの User-Agent なら true（訪問数にカウントしない）
fn is_bot_user_agent(headers: &HeaderMap) -> bool {
    let ua = match headers.get("user-agent") {
        Some(v) => match v.to_str() {
            Ok(s) => s.to_lowercase(),
            Err(_) => return true, // 不正な値はカウントしない
        },
        None => return true, // User-Agent なしはボット扱い
    };
    let bot_patterns = [
        "bot",
        "crawler",
        "spider",
        "slurp",   // Yahoo
        "googlebot",
        "bingbot",
        "yandex",
        "baiduspider",
        "facebookexternalhit",
        "twitterbot",
        "rogerbot",
        "linkedinbot",
        "embedly",
        "quora link preview",
        "showyoubot",
        "outbrain",
        "pinterest",
        "slackbot",
        "vkshare",
        "w3c_validator",
        "whatsapp",
        "applebot",
        "headless",
        "phantom",
        "selenium",
        "curl",
        "wget",
        "python-",
        "go-http",
        "java/",
        "httpie",
        "postman",
        "insomnia",
        "scanner",
        "monitor",
    ];
    bot_patterns.iter().any(|p| ua.contains(p))
}

pub async fn increment_visits(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> Result<Json<VisitsResponse>, (StatusCode, &'static str)> {
    let row: (i64,) = sqlx::query_as("SELECT count FROM visits WHERE id = 1")
        .fetch_one(&state.pool)
        .await
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "DB error"))?;
    let count = row.0 as u64;

    if is_bot_user_agent(&headers) {
        return Ok(Json(VisitsResponse { count }));
    }

    sqlx::query("UPDATE visits SET count = count + 1 WHERE id = 1")
        .execute(&state.pool)
        .await
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "DB error"))?;
    let row: (i64,) = sqlx::query_as("SELECT count FROM visits WHERE id = 1")
        .fetch_one(&state.pool)
        .await
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "DB error"))?;
    Ok(Json(VisitsResponse {
        count: row.0 as u64,
    }))
}

pub async fn serve_upload(
    State(state): State<Arc<AppState>>,
    Path(UploadPath { filename }): Path<UploadPath>,
) -> impl IntoResponse {
    let path = state.upload_dir.join(&filename);
    if !path.starts_with(&state.upload_dir) {
        return (StatusCode::BAD_REQUEST, "Invalid path").into_response();
    }
    match tokio::fs::read(&path).await {
        Ok(data) => {
            let content_type = infer_content_type(&filename);
            (
                [(axum::http::header::CONTENT_TYPE, content_type)],
                data,
            )
                .into_response()
        }
        Err(_) => (StatusCode::NOT_FOUND, "Not found").into_response(),
    }
}

fn infer_content_type(filename: &str) -> &'static str {
    let lower = filename.to_lowercase();
    if lower.ends_with(".png") {
        "image/png"
    } else if lower.ends_with(".gif") {
        "image/gif"
    } else if lower.ends_with(".webp") {
        "image/webp"
    } else {
        "image/jpeg"
    }
}

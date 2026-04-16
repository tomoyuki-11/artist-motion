use axum::http::StatusCode;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct AdminClaims {
    pub sub: String,
    pub exp: i64,
    pub iat: i64,
}

const EXP_HOURS: i64 = 24;

pub fn create_token(secret: &[u8]) -> Result<String, (StatusCode, &'static str)> {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "time error"))?
        .as_secs() as i64;
    let claims = AdminClaims {
        sub: "admin".to_string(),
        exp: now + EXP_HOURS * 3600,
        iat: now,
    };
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret),
    )
    .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "token creation failed"))
}

pub fn admin_claims(token: &str, secret: &[u8]) -> Result<AdminClaims, (StatusCode, &'static str)> {
    let mut validation = Validation::default();
    validation.validate_exp = true;
    let token_data = decode::<AdminClaims>(
        token,
        &DecodingKey::from_secret(secret),
        &validation,
    )
    .map_err(|_| (StatusCode::UNAUTHORIZED, "Invalid or expired token"))?;
    Ok(token_data.claims)
}

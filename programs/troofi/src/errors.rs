use anchor_lang::prelude::*;

#[error_code]
pub enum TroofiErrors {
    #[msg("Invalid Asset Account")]
    InvalidAsset,
    #[msg("Insufficient Funds")]
    InsufficientFunds,
}

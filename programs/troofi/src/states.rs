use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Listing {
    pub seller: Pubkey,
    pub asset: Pubkey,
    pub price: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct User {
    pub user: Pubkey,
    pub bump: u8,
    pub vault_bump: u8,
}

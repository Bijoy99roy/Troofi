use anchor_lang::{prelude::*, system_program};

use crate::Marketplace;

#[derive(Accounts)]
pub struct InitializeFeeVault<'info> {
    #[account(
        mut,
        address = ADMIN_PUBKEY
    )]
    pub admin: Signer<'info>,

    /// CHECK: This PDA is derived inside the program and does not need additional checks
    #[account(
        init_if_needed,
        payer = admin,
        owner = system_program::ID,  
        space = 0,                        
        seeds = [b"marketplace_fee", admin.key().as_ref()],
        bump
    )]
    pub fee_vault: AccountInfo<'info>,

    #[account(
        init_if_needed,
        payer = admin,
        space = 8 + Marketplace::INIT_SPACE,
        seeds = [b"marketplace", admin.key().as_ref()],
        bump
    )]
    pub marketplace_pda: Account<'info, Marketplace>,
    

    pub system_program: Program<'info, System>,
}

pub const ADMIN_PUBKEY: Pubkey = pubkey!("nftuLPVQupTr1coaiWzNV2WC8gchv12SsRz5JV32jLf");

impl<'info> InitializeFeeVault<'info> {
    pub fn initialize(&mut self, bump:u8, vault_bump:u8) -> Result<()>{
        let marketplace = &mut self.marketplace_pda;

        marketplace.admin = pubkey!("nftuLPVQupTr1coaiWzNV2WC8gchv12SsRz5JV32jLf");
        marketplace.fee_numerator = 25;
        marketplace.fee_denominator = 10000;
        marketplace.bump = bump;
        marketplace.fee_vault_bump = vault_bump;
        Ok(())
    }
}
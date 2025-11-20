use anchor_lang::{prelude::*, system_program};

use crate::{Marketplace, TroofiErrors};

#[derive(Accounts)]
pub struct WithdrawFees<'info> {
    #[account(
        mut,
        address = ADMIN_PUBKEY
    )]
    pub admin: Signer<'info>,

    /// CHECK: This PDA is derived inside the program and does not need additional checks
    #[account(
        mut,
        owner = system_program::ID,                   
        seeds = [b"marketplace_fee", admin.key().as_ref()],
        bump=marketplace_pda.fee_vault_bump,
    )]
    pub fee_vault: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [b"marketplace", admin.key().as_ref()],
        bump=marketplace_pda.bump
    )]
    pub marketplace_pda: Account<'info, Marketplace>,

    pub system_program: Program<'info, System>,
}

pub const ADMIN_PUBKEY: Pubkey = pubkey!("nftuLPVQupTr1coaiWzNV2WC8gchv12SsRz5JV32jLf");


impl<'info> WithdrawFees<'info>{
    pub fn withdraw(&self) -> Result<()>{
        let rent = Rent::get()?;
        let lamports = rent.minimum_balance(0);
        require!(self.fee_vault.to_account_info().lamports() > lamports, TroofiErrors::InsufficientFunds);

        let admin_account_info = self.admin.to_account_info();

        
        // Transfer marketplace fee to admin
        let ix= system_program::Transfer {
        from: self.fee_vault.to_account_info(),
        to: admin_account_info,
    };

        let admin_key = self.admin.key();
        let vault_bump = self.marketplace_pda.fee_vault_bump;
        let seeds = [b"marketplace_fee", admin_key.as_ref(),  &[vault_bump]];
        let signer_seed = &[&seeds[..]];

        let cpi_context = CpiContext::new_with_signer(self.system_program.to_account_info(), ix, signer_seed);

        system_program::transfer(cpi_context, self.fee_vault.to_account_info().lamports() - lamports)?;

        Ok(())
    }
}
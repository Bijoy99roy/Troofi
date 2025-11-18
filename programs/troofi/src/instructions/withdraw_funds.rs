use anchor_lang::{prelude::*, system_program::{self, Transfer}};

use crate::{ User};

#[derive(Accounts)]
pub struct WithdrawFunds<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user", seller.key().as_ref()],
        bump=user_pda.bump
    )]
    pub user_pda: Account<'info, User>,

    /// CHECK: This PDA is derived inside the program and does not need additional checks
    #[account(
        mut,
        seeds = [b"vault", seller.key().as_ref()],
        bump=user_pda.vault_bump,
        owner = system_program::ID,                   
    )]
    pub vault_pda: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> WithdrawFunds<'info> {
    pub fn withdraw(&self) -> Result<()> {
        

        let seller_account_info = self.seller.to_account_info();

        let sellet_key = self.seller.key();
        
        // Transfer buyer fund to marketplace vault of seller
        let ix: Transfer<'_> = system_program::Transfer {
        from: self.vault_pda.to_account_info(),
        to: seller_account_info,
    };

        let seeds = [b"vault", sellet_key.as_ref(), &[self.user_pda.vault_bump]];
        let signer_seed = &[&seeds[..]];

        let cpi_context = CpiContext::new_with_signer(self.system_program.to_account_info(), ix, signer_seed);

        system_program::transfer(cpi_context, self.vault_pda.to_account_info().lamports())?;

        Ok(())
    }
}

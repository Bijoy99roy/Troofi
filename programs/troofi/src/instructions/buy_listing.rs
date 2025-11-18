use anchor_lang::{prelude::*, system_program::{self, Transfer}};
use mpl_core::instructions::TransferV1CpiBuilder;

use crate::{Listing, TroofiErrors, User};

#[derive(Accounts)]
pub struct BuyListing<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: The core asset account
    pub asset: AccountInfo<'info>,

    #[account(
        mut,
        seeds=[b"listing", listing_pda.seller.key().as_ref(), asset.key().as_ref()],
        bump=listing_pda.bump
    )]
    pub listing_pda: Account<'info, Listing>,

    #[account(
        mut,
        seeds = [b"user", listing_pda.seller.key().as_ref()],
        bump=user_pda.bump
    )]
    pub user_pda: Account<'info, User>,

    /// CHECK: This PDA is derived inside the program and does not need additional checks
    #[account(
        mut,
        seeds = [b"vault", listing_pda.seller.key().as_ref()],
        bump=user_pda.vault_bump,
        owner = system_program::ID,                   
    )]
    pub vault_pda: AccountInfo<'info>,

    /// CHECK: mpl-core program
    pub mpl_core_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> BuyListing<'info> {
    pub fn buy(&self) -> Result<()> {
        require_keys_eq!(
            self.asset.key(),
            self.listing_pda.asset.key(),
            TroofiErrors::InvalidAsset
        );

        require!(
            self.buyer.to_account_info().lamports() >= self.listing_pda.price,
            TroofiErrors::InsufficientFunds
        );

        // Transfer buyer fund to marketplace vault of seller
        let ix: Transfer<'_> = system_program::Transfer {
        from: self.buyer.to_account_info(),
        to: self.vault_pda.to_account_info(),
    };
        let cpi_context = CpiContext::new(self.system_program.to_account_info(), ix);

        system_program::transfer(cpi_context, self.listing_pda.price)?;

        // CPI to mpl core to transfer the asset to buyer
        TransferV1CpiBuilder::new(&self.mpl_core_program.to_account_info())
            .asset(&self.asset.to_account_info())
            .authority(Some(&self.listing_pda.to_account_info()))
            .new_owner(&self.buyer.to_account_info())
            .system_program(Some(&self.system_program.to_account_info()))
            .invoke()?;
        
        Ok(())
    }
}

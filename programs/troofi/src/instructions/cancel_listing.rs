use anchor_lang::prelude::*;
use mpl_core::instructions::TransferV1CpiBuilder;

use crate::Listing;

#[derive(Accounts)]
pub struct CancelListing<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    /// CHECK: The core asset account
    #[account(mut)]
    pub asset: AccountInfo<'info>,

    #[account(
        mut,
        seeds=[b"listing", listing_pda.seller.key().as_ref(), listing_pda.asset.key().as_ref()],
        bump=listing_pda.bump
    )]
    pub listing_pda: Account<'info, Listing>,

    /// CHECK: mpl-core program
    pub mpl_core_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> CancelListing<'info> {
    pub fn cancel(&self) -> Result<()> {
        // CPI to mpl core to transfer the asset to listing pda
        TransferV1CpiBuilder::new(&self.mpl_core_program.to_account_info())
            .asset(&self.asset.to_account_info())
            .authority(Some(&self.listing_pda.to_account_info()))
            .new_owner(&self.seller.to_account_info())
            .system_program(Some(&self.system_program.to_account_info()))
            .invoke()?;

        Ok(())
    }
}

use anchor_lang::prelude::*;
use mpl_core::instructions::TransferV1CpiBuilder;

use crate::Listing;

#[derive(Accounts)]
pub struct InitalizeListing<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    /// CHECK: The core asset account
    #[account(mut)]
    pub asset: AccountInfo<'info>,

    #[account(
        init,
        payer=seller,
        space= 8+Listing::INIT_SPACE,
        seeds=[b"listing", seller.key().as_ref(), asset.key().as_ref()],
        bump
    )]
    pub listing_pda: Account<'info, Listing>,
    /// CHECK: mpl-core program
    pub mpl_core_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> InitalizeListing<'info> {
    pub fn initialize(&mut self, price: u64, bump: u8) -> Result<()> {
        let listing = &mut self.listing_pda;

        listing.seller = self.seller.key();
        listing.asset = self.asset.key();
        listing.price = price;
        listing.bump = bump;

        // CPI to mpl core to transfer the asset to listing pda
        TransferV1CpiBuilder::new(&self.mpl_core_program.to_account_info())
            .asset(&self.asset.to_account_info())
            .authority(Some(&self.seller.to_account_info()))
            .new_owner(&self.listing_pda.to_account_info())
            .system_program(Some(&self.system_program.to_account_info()))
            .invoke()?;

        Ok(())
    }
}

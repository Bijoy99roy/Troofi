use anchor_lang::prelude::*;
pub mod errors;
pub use errors::*;
pub mod states;
pub use states::*;
pub mod instructions;
pub use instructions::*;
declare_id!("4hXnADEUHeDLGZtiPiESaRoutUPRHX2NDruhNr2W6rTc");

#[program]
pub mod troofi {
    use mpl_core::instructions::{TransferV1Builder, TransferV1CpiBuilder};

    use super::*;

    pub fn initialize_listing(ctx: Context<InitalizeListing>, price: u64) -> Result<()> {
        let listing = &mut ctx.accounts.listing_pda;

        listing.seller = ctx.accounts.seller.key();
        listing.asset = ctx.accounts.asset.key();
        listing.price = price;
        listing.bump = ctx.bumps.listing_pda;

        // CPI to mpl core to transfer the asset to listing pda
        TransferV1CpiBuilder::new(&ctx.accounts.mpl_core_program.to_account_info())
            .asset(&ctx.accounts.asset.to_account_info())
            .authority(Some(&ctx.accounts.seller.to_account_info()))
            .new_owner(&ctx.accounts.listing_pda.to_account_info())
            .system_program(Some(&ctx.accounts.system_program.to_account_info()))
            .invoke()?;
        Ok(())
    }
}

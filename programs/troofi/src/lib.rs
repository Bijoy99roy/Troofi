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

    use super::*;

    pub fn initialize_listing(ctx: Context<InitalizeListing>, price: u64) -> Result<()> {
        ctx.accounts.initialize(
            price,
            ctx.bumps.listing_pda,
            ctx.bumps.user_pda,
            ctx.bumps.vault_pda,
        )?;
        Ok(())
    }

    pub fn buy_listing(ctx: Context<BuyListing>) -> Result<()> {
        ctx.accounts.buy()?;
        Ok(())
    }
}

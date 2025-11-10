use anchor_lang::prelude::*;

use crate::Listing;

#[derive(Accounts)]
pub struct InitalizeListing<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

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

    pub mpl_core_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

use anchor_lang::{prelude::*, system_program};
use mpl_core::{instructions::{TransferV1Cpi, TransferV1CpiAccounts, TransferV1CpiBuilder, TransferV1InstructionArgs}, types::{CompressionProof, UpdateAuthority}};

use crate::{Listing, User};

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

    #[account(
        init_if_needed,
        payer = seller,
        space = 8 + User::INIT_SPACE,
        seeds = [b"user", seller.key().as_ref()],
        bump
    )]
    pub user_pda: Account<'info, User>,

    /// CHECK: This PDA is derived inside the program and does not need additional checks
    #[account(
        init_if_needed,
        payer = seller,
        seeds = [b"vault", seller.key().as_ref()],
        bump,
        owner = system_program::ID,  
        space = 0                     
    )]
    pub vault_pda: AccountInfo<'info>,

    /// CHECK: mpl-core program
    pub mpl_core_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> InitalizeListing<'info> {
    pub fn initialize(&mut self, price: u64, listing_bump: u8, user_bump:u8, vault_bump:u8) -> Result<()> {
        let listing = &mut self.listing_pda;

        let user = &mut self.user_pda;

        listing.seller = self.seller.key();
        listing.asset = self.asset.key();
        listing.price = price;
        listing.bump = listing_bump;

        user.bump = user_bump;
        user.user = self.seller.key();
        user.vault_bump = vault_bump;

        
        // CPI to mpl core to transfer the asset to listing pda
        TransferV1CpiBuilder::new(&self.mpl_core_program.to_account_info())
            .asset(&self.asset.to_account_info())
            .collection(None)
            .authority(Some(&self.seller.to_account_info()))
            .new_owner(&self.listing_pda.to_account_info())
            .payer(&self.seller.to_account_info())
            .log_wrapper(None)
            .system_program(Some(&self.system_program.to_account_info()))
            .invoke()?;

        // let sys_ai = self.system_program.to_account_info();
        // let seller_ai = self.seller.to_account_info();
//         let accounts = TransferV1CpiAccounts {
//             asset:        &self.asset.to_account_info(),
//             collection:   None,
//             payer:        &self.seller.to_account_info(),
//             authority:    Some(&seller_ai),
//             new_owner:    &self.listing_pda.to_account_info(),
//             system_program: Some(&sys_ai),
//             log_wrapper:  None,
//         };

//         let proof = TransferV1InstructionArgs {
//     compression_proof: None,
// };
//         TransferV1Cpi::new(&self.mpl_core_program.to_account_info(), accounts, proof)
//         .invoke()?;


        // mpl_core::instructions::TransferV1Cpi {
        //     asset: &self.asset.to_account_info(),
        //     collection: None,
        //     payer:&self.seller.to_account_info(),
        //     authority: Some(&seller_ai),
        //     new_owner: &self.listing_pda.to_account_info(),
        //     system_program: Some(&sys_ai),
        //     log_wrapper: None,
        //     __program: &self.mpl_core_program.to_account_info(),
        //     __args: mpl_core::instructions::TransferV1InstructionArgs {
        //         compression_proof: None,
        //     },
        // }
        // .invoke()?;

        Ok(())
    }
}

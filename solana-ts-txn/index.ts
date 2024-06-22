import {Connection} from "@solana/web3.js";
import {getTokenInfo} from "./getTokenDetail";

const SOLANA_RPC = 'https://mainnet.helius-rpc.com/?api-key=abc1f090-f939-44ea-9c74-96d613d2c87a'

const token : string = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"

// const  = getTokenInfo(tokenToBuy)

const main = async () => {
    console.log(`in main`)
    const tokenInfo = await getTokenInfo(token)
    console.log(`tokenInfo is`, tokenInfo)
}

main()
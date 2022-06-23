const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { network } = require("hardhat")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    // Pulling deploy and log functions out of deployments
    const { deploy, log } = deployments
    // Grabbing the deployer account from our Named Accounts section in our config
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    let ethUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {
        // .get lets us get the most recent deployment of a contract
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        // Grabs the price feed address from our networkConfig inside of our helper-hardhat-config based on the changId we are on
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    // When going for localhost or hardhat network we want to use a mock
    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, // PriceFeed address for our FundMe.sol constructor
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1, // Based on block confirmtions given in our config for a network, if not specified then 1
    })

    // If not on a local network and our etherscan api key exists then we are going to verfiy
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args)
    }

    log("-----------------------------------------------")
}

module.exports.tags = ["all", "fundme"]

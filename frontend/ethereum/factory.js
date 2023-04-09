import web3 from "./web3";
import CampaignFactory from "../contracts/CampaignFactory.json";
import CampaignFactoryAddress from "../contracts/contract-address.json"

const instance = new web3.eth.Contract(
    CampaignFactory.abi,
    CampaignFactoryAddress.CampaignFactory
);

export default instance;

const { expect } = require('chai');
const {ethers} = require('hardhat');
const {eth} = require('ethers');

describe('CampaignFactory', () => {
  let CampaignFactory, Campaign;
  let campaignFactory, campaign;
  let owner, contributor, recipient;   

  const minimumContribution = ethers.utils.parseEther('0.1');
  const aboveMinimumContribution = ethers.utils.parseEther('0.2');


  beforeEach(async () => {
    [owner, contributor, recipient] = await ethers.getSigners();
    CampaignFactory = await ethers.getContractFactory('CampaignFactory');
    Campaign = await ethers.getContractFactory('Campaign');

    campaignFactory = await CampaignFactory.deploy();
    await campaignFactory.deployed();

    await campaignFactory.createCampaign(minimumContribution);

    const [campaignAddress] = await campaignFactory.getDeployedCampaigns();
    campaign = await Campaign.attach(campaignAddress);
  });

  it('should deploy a factory and a campaign successfully', async () => {
    expect(campaignFactory.address).to.be.properAddress;
    expect(campaign.address).to.be.properAddress;
  });

  it('should mark the caller as the campaign manager', async () => {
    const manager = await campaign.manager();
    expect(manager).to.equal(owner.address);
  });

  it('should allow people to contribute money and mark them as approvers', async () => {
    const contribution = aboveMinimumContribution
    await campaign.connect(contributor).contribute({ value: contribution });

    const isApprover = await campaign.approvers(contributor.address);
    expect(isApprover).to.be.true;
  });

  it('should require a minimum contribution', async () => {
    const contribution = minimumContribution.sub(ethers.utils.parseEther('0.01'));
    await expect(campaign.connect(contributor).contribute({ value: contribution })).to.be.revertedWith(
      'The contribution must be greater than the minimum amount.'
    );

    const isApprover = await campaign.approvers(contributor.address);
    expect(isApprover).to.be.false;
  });

  it('should allow a manager to make a payment request', async () => {
    const description = 'Buy some materials';
    const value = ethers.utils.parseEther('0.05');

    await campaign.createRequest(description, value, recipient.address);

    const request = await campaign.requests(0);
    expect(request.description).to.equal(description);
    expect(request.value).to.equal(value);
    expect(request.recipient).to.equal(recipient.address);
    expect(request.complete).to.be.false;
    expect(request.approvalCount).to.equal(0);
  });

  it('should process requests', async () => {
    // Contribute enough to approve requests
    const contribution = aboveMinimumContribution;
    await campaign.connect(contributor).contribute({ value: contribution });

    // Create a request
    const description = 'Buy some materials';
    const value = ethers.utils.parseEther('0.05');
    await campaign.createRequest(description, value, recipient.address);

    // Approve the request
    await campaign.connect(contributor).approveRequest(0);

    // Check the approval count
    const request = await campaign.requests(0);
    expect(request.approvalCount).to.equal(1);

    // Get the initial balance of the recipient
    const initialBalance = await ethers.provider.getBalance(recipient.address);
    console.log(initialBalance)
    // Finalize the request
    await campaign.finalizeRequest(0);

    // Check that the request has been processed
    const balance = await ethers.provider.getBalance(recipient.address);
    const endBalance = initialBalance.add(value);
    expect(balance).to.equal(endBalance);
  });
});

//SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

/**
 * @title InstaLite Connector
 * @dev Import Position
 */

import { TokenInterface } from "../../common/interfaces.sol";
import { Basic } from "../../common/basic.sol";
import { Events } from "./events.sol";
import { IInstaLite } from "./interface.sol";

abstract contract InstaLiteConnector is Events, Basic {
	TokenInterface internal constant astethToken =
		TokenInterface(0x1982b2F5814301d4e9a8b0201555376e62F82428);
	TokenInterface internal constant stethToken =
		TokenInterface(0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84);
	IInstaLite internal constant iEth =
		IInstaLite(0xc383a3833A87009fD9597F8184979AF5eDFad019);

	/**
	 * @dev Supply ETH/ERC20
	 * @notice Supply a token into Instalite.
	 * @param flashTkn_ Address of flash token.
	 * @param flashAmt_ Flash loan amount.
	 * @param route_ Flash loan route.
	 * @param stEthAmt_ Amount of astEthToken to be imported.
	 * @param wethAmt_ Amount of weth borrows to be imported.
	 * @param getIds IDs to retrieve amt.
	 * @param setIds array of IDs to store the amount of tokens deposited.
	 */
	function importPosition(
		address flashTkn_,
		uint256 flashAmt_,
		uint256 route_,
		uint256 stEthAmt_,
		uint256 wethAmt_,
		uint256[] memory getIds,
		uint256[] memory setIds
	) external returns (string memory eventName_, bytes memory eventParam_) {
		uint256 stEthAmt_ = getUint(getIds[0], stEthAmt_);
		uint256 wethAmt_ = getUint(getIds[1], wethAmt_);
		stEthAmt_ = stEthAmt_ == type(uint256).max
			? astethToken.balanceOf(msg.sender)
			: stEthAmt_;

		astethToken.approve(address(iEth), stEthAmt_);

		iEth.importPosition(
			flashTkn_,
			flashAmt_,
			route_,
			address(this),
			stEthAmt_,
			wethAmt_
		);

		setUint(setIds[0], stEthAmt_);
		setUint(setIds[1], wethAmt_);

		eventName_ = "LogImport(address,uint256,uint256,uint256,uint256,uint256[],uint256[])";
		eventParam_ = abi.encode(
			flashTkn_,
			flashAmt_,
			route_,
			stEthAmt_,
			wethAmt_,
			getIds,
			setIds
		);
	}
}

contract ConnectV2InstaLiteImport is InstaLiteConnector {
	string public constant name = "InstaLite-Import-v1.0";
}

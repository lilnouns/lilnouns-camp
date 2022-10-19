import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import React from "react";
import { View, Text, Dimensions } from "react-native";
import { useEnsName } from "wagmi";
import * as Shades from "@shades/common";
import { ModalActionButtonGroup } from "./account-modal";
import { UserProfilePicture } from "./channel-list";

const { useAppScope } = Shades.app;
const { truncateAddress } = Shades.utils.ethereum;

const screen = Dimensions.get("screen");

const textDimmed = "hsl(0,0%,50%)";

export const options = { presentation: "modal" };

const UserModal = ({ route }) => {
  const { state } = useAppScope();
  const user = state.selectUser(route.params.userId);
  const { data: ensName } = useEnsName({ address: user.walletAddress });
  const [didRecentlyCopyAddress, setDidRecentlyCopyAddress] =
    React.useState(false);

  const actions = [
    { label: "Send message", disabled: true, onPress: () => {} },
    {
      label: didRecentlyCopyAddress
        ? "Wallet address copied to clipboard"
        : "Copy wallet address",
      onPress: () => {
        Clipboard.setStringAsync(user.walletAddress).then(() => {
          setDidRecentlyCopyAddress(true);
          setTimeout(() => {
            setDidRecentlyCopyAddress(false);
          }, 2800);
        });
      },
    },
  ];
  const truncatedAddress = truncateAddress(user.walletAddress);
  const userDisplayName = user.hasCustomDisplayName
    ? user.displayName
    : ensName ?? truncatedAddress;

  return (
    <View
      style={{
        backgroundColor: "hsl(0,0%,10%)",
        flex: 1,
      }}
    >
      <UserProfilePicture
        user={user}
        size={screen.width}
        large
        style={{ borderRadius: 0 }}
      />

      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 20,
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: 20,
            fontWeight: "600",
            lineHeight: 22,
          }}
        >
          {userDisplayName}
        </Text>
        {userDisplayName !== truncatedAddress && (
          <Text
            style={{
              color: textDimmed,
              fontSize: 14,
              fontWeight: "400",
              lineHeight: 18,
            }}
          >
            {ensName == null
              ? truncatedAddress
              : `${ensName} (${truncatedAddress})`}
          </Text>
        )}

        <View style={{ height: 20 }} />

        <ModalActionButtonGroup actions={actions} />
        <View style={{ height: 20 }} />
        <ModalActionButtonGroup
          actions={[
            {
              label: "Etherscan",
              onPress: () => {
                Linking.openURL(
                  `https://etherscan.io/address/${user.walletAddress}`
                );
              },
            },
          ]}
        />
      </View>
    </View>
  );
};

export default UserModal;

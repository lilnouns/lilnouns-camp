import React from "react";
import { css } from "@emotion/react";
import { useAppScope } from "@shades/common";
import generateAvatar from "../utils/avatar-generator";

const ServerMemberAvatar = ({
  serverId,
  userId,
  size = "2rem",
  borderRadius = "0.3rem",
  ...props
}) => {
  const { state } = useAppScope();
  const member =
    serverId != null
      ? state.selectServerMemberWithUserId(serverId, userId)
      : state.selectUser(userId);

  const avatarDataUrl = React.useMemo(() => {
    if (member == null || member.pfpUrl != null) return;

    return generateAvatar({
      seed: member.walletAddress,
      size: 8,
      scale: 10,
    });
  }, [member]);

  if (member == null)
    return (
      <div
        css={(theme) =>
          css({
            borderRadius,
            background: theme.colors.backgroundSecondary,
            height: size,
            width: size,
          })
        }
        {...props}
      />
    );

  return (
    <img
      src={member.pfpUrl ?? avatarDataUrl}
      css={(theme) =>
        css({
          borderRadius,
          background: theme.colors.backgroundSecondary,
          height: size,
          width: size,
          objectFit: "cover",
        })
      }
      {...props}
    />
  );
};

export default ServerMemberAvatar;

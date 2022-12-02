import { createSelector } from "reselect";
import combineReducers from "../utils/combine-reducers";
import { indexBy, unique, sort } from "../utils/array";
import { omitKey } from "../utils/object";
import { getMentions } from "../utils/message";
import { arrayShallowEquals } from "../utils/reselect";
import * as Permissions from "../utils/permissions";
import { selectUser } from "./users";

const sortChannelsByActivity = (channels, readStatesByChannelId) =>
  sort((c1, c2) => {
    const [t1, t2] = [c1, c2].map((c) => {
      const readState = readStatesByChannelId[c.id];
      return new Date(readState?.lastMessageAt ?? c.createdAt).getTime();
    });
    return t1 > t2 ? -1 : t1 < t2 ? 1 : 0;
  }, channels);

const entriesById = (state = {}, action) => {
  switch (action.type) {
    case "fetch-client-boot-data-request-successful":
    case "fetch-user-channels-request-successful":
    case "fetch-publicly-readable-channels-request-successful": {
      const mergedChannels = action.channels.map((c) => {
        const existingChannelData = state[c.id];
        return { ...existingChannelData, ...c };
      });
      const entriesById = indexBy((c) => c.id, mergedChannels);
      return { ...state, ...entriesById };
    }

    case "fetch-channel-request-successful": {
      const existingChannelData = state[action.channel.id];
      return {
        ...state,
        [action.channel.id]: {
          ...existingChannelData,
          ...action.channel,
        },
      };
    }

    case "fetch-channel-members-request-successful": {
      const existingChannelData = state[action.channelId];
      return {
        ...state,
        [action.channelId]: {
          ...existingChannelData,
          id: action.channelId,
          memberUserIds: action.members.map((m) => m.id),
        },
      };
    }

    case "delete-channel-request-successful":
      return { ...state, [action.id]: { isDeleted: true } };

    case "leave-channel:request-sent": {
      const existingChannelData = state[action.channelId];
      return {
        ...state,
        [action.channelId]: {
          ...existingChannelData,
          memberUserIds: existingChannelData.memberUserIds.filter(
            (id) => id !== action.userId
          ),
        },
      };
    }

    case "server-event:channel-updated": {
      const channelId = action.data.channel.id;
      return {
        ...state,
        [channelId]: {
          ...state[channelId],
          id: channelId,
          ...action.data.channel,
        },
      };
    }

    case "server-event:channel-user-invited": {
      const channelId = action.data.channel;
      return {
        ...state,
        [channelId]: {
          ...state[channelId],
          id: channelId,
          memberUserIds: [action.data.user.id],
        },
      };
    }

    case "logout":
      return {};

    default:
      return state;
  }
};

const metaById = (state = {}, action) => {
  switch (action.type) {
    case "fetch-channel-public-permissions-request-successful": {
      const meta = state[action.channelId];
      return {
        ...state,
        [action.channelId]: { ...meta, publicPermissions: action.permissions },
      };
    }

    case "fetch-channel-permissions:request-successful": {
      const meta = state[action.channelId];
      return {
        ...state,
        [action.channelId]: { ...meta, permissions: action.permissions },
      };
    }

    case "messages-fetched": {
      const config = state[action.channelId];
      const hasAllMessages = action.messages.length < action.limit;
      return {
        ...state,
        [action.channelId]: {
          ...config,
          hasAllMessages,
          hasFetchedMessages: true,
        },
      };
    }

    case "logout":
      return {};

    default:
      return state;
  }
};

const starsByChannelId = (state = {}, action) => {
  switch (action.type) {
    case "fetch-starred-items:request-successful": {
      const channelStars = action.stars.filter((s) => s.type === "channel");
      return indexBy((s) => s.reference, channelStars);
    }

    case "star-channel:request-sent":
    case "star-channel:request-successful":
      return { ...state, [action.channelId]: action.star };

    case "unstar-channel:request-sent":
    case "unstar-channel:request-successful":
      return omitKey(action.channelId, state);

    case "logout":
      return {};

    default:
      return state;
  }
};

const publicChannelIds = (state = [], action) => {
  switch (action.type) {
    case "fetch-publicly-readable-channels-request-successful":
      return action.channels.map((c) => c.id);

    case "logout":
      return [];

    default:
      return state;
  }
};

const readStatesById = (state = {}, action) => {
  switch (action.type) {
    case "fetch-client-boot-data-request-successful":
    case "fetch-user-channels-request-successful":
    case "fetch-user-channels-read-states-request-successful": {
      const readStates = action.readStates ?? [];
      const channels = action.channels ?? [];

      const channelsById = indexBy((c) => c.id, channels);
      const readStatesByChannelId = indexBy((s) => s.channel, readStates);

      const channelIds = unique([
        ...Object.keys(channelsById),
        ...Object.keys(readStatesByChannelId),
      ]);

      const entriesByChannelId = indexBy(
        (s) => s.channelId,
        channelIds.map((channelId) => {
          const channel = channelsById[channelId];
          const readState = readStatesByChannelId[channelId];

          const nextState = { channelId, ...state[channelId] };

          if (channel?.lastMessageAt != null)
            nextState.lastMessageAt = channel.lastMessageAt;

          if (readState?.last_read_at != null)
            nextState.lastReadAt = readState.last_read_at;

          if (readState?.mention_count != null)
            nextState.unreadMentionMessageIds = Array(
              readState.mention_count
            ).fill();

          return nextState;
        })
      );

      return { ...state, ...entriesByChannelId };
    }

    // case "fetch-user-channels-request-successful": {
    //   const mergedReadStates = action.channels.map((c) => {
    //     const existingState = state[c.id];
    //     return {
    //       ...existingState,
    //       channelId: c.id,
    //       lastMessageAt: c.last_message_at,
    //     };
    //   });
    //   const entriesByChannelId = indexBy((s) => s.channelId, mergedReadStates);
    //   return { ...state, ...entriesByChannelId };
    // }

    case "mark-channel-read:request-sent":
      return {
        ...state,
        [action.channelId]: {
          ...state[action.channelId],
          lastReadAt: action.readAt.toISOString(),
          unreadMentionMessageIds: [],
        },
      };

    case "message-create-request-sent":
    case "message-create-request-successful":
      return {
        ...state,
        [action.message.channel]: {
          ...state[action.message.channel],
          lastReadAt: action.message.created_at,
          lastMessageAt: action.message.created_at,
        },
      };

    case "server-event:channel-read":
      return {
        ...state,
        [action.data.channel]: {
          ...state[action.data.channel],
          lastReadAt: action.data.read_at,
        },
      };

    case "server-event:message-created": {
      const isOwnMessage =
        action.user != null && action.data.message.author === action.user.id;
      const channelState = state[action.data.message.channel];

      const userMentions = getMentions(action.data.message.blocks).filter(
        (m) => m.ref === action.user.id
      );
      const unreadMentionMessageIds =
        channelState?.unreadMentionMessageIds ?? [];

      return {
        ...state,
        [action.data.message.channel]: {
          ...channelState,
          lastMessageAt: action.data.message.created_at,
          lastReadAt: isOwnMessage
            ? action.data.message.created_at
            : channelState?.lastReadAt,
          unreadMentionMessageIds:
            userMentions.length === 0
              ? unreadMentionMessageIds
              : [...unreadMentionMessageIds, action.data.message.id],
        },
      };
    }

    case "server-event:message-removed": {
      const channelState = state[action.data.message.channel];
      return {
        ...state,
        [action.data.message.channel]: {
          ...channelState,
          unreadMentionMessageIds: channelState.unreadMentionMessageIds.filter(
            (id) => id !== action.data.message.id
          ),
        },
      };
    }

    case "server-event:message-updated": {
      const channel = state[action.data.message.channel];
      const messageId = action.data.message.id;
      const userMentions = getMentions(action.data.message.blocks).filter(
        (m) => m.ref === action.user.id
      );

      return {
        ...state,
        [action.data.message.channel]: {
          ...channel,
          unreadMentionMessageIds:
            userMentions.length === 0
              ? channel.unreadMentionMessageIds?.filter(
                  (id) => id !== messageId
                ) ?? []
              : unique([...channel.unreadMentionMessageIds, messageId]),
        },
      };
    }

    case "logout":
      return {};

    default:
      return state;
  }
};

export const selectChannelName = createSelector(
  (state, channelId) => state.channels.entriesById[channelId],
  (state) => state.me.user?.id,
  (state, channelId) => {
    const channel = state.channels.entriesById[channelId];

    if (channel == null || channel.kind !== "dm") return null;

    return channel.memberUserIds.map((userId) => selectUser(state, userId));
  },
  (channel, loggedInUserId, channelMemberUsers) => {
    if (channel == null || channel.isDeleted) return null;

    if (channel.name != null || channel.kind !== "dm") return channel.name;

    if (channel.memberUserIds.length === 1)
      return channelMemberUsers[0] == null
        ? null
        : `${channelMemberUsers[0].displayName} (you)`;

    return channelMemberUsers
      .filter((u) => u?.id !== loggedInUserId)
      .map((u) => u?.displayName)
      .filter(Boolean)
      .join(", ");
  },
  { memoizeOptions: { maxSize: 1000, equalityCheck: arrayShallowEquals } }
);

export const selectChannel = (state, channelId) => {
  const channel = state.channels.entriesById[channelId];
  if (channel == null || channel.isDeleted) return null;
  return channel;
};

export const selectChannelMentionCount = (state, channelId) => {
  const channelState = state.channels.readStatesById[channelId];
  if (channelState == null || channelState.unreadMentionMessageIds == null)
    return 0;
  return channelState.unreadMentionMessageIds.length;
};

export const selectTotalMentionCount = createSelector(
  (state) => {
    const channelIds = Object.keys(state.channels.entriesById);
    const channelMentionCounts = channelIds.map((id) =>
      selectChannelMentionCount(state, id)
    );
    return channelMentionCounts;
  },
  (mentionCounts) => mentionCounts.reduce((sum, count) => sum + count, 0),
  { memoizeOptions: { maxSize: 1000 } }
);

export const selectChannelHasUnread = createSelector(
  (state, channelId) => state.channels.readStatesById[channelId],
  (channelState) => {
    if (channelState == null) return false;

    const lastReadTimestamp =
      channelState.lastReadAt == null
        ? new Date().getTime()
        : new Date(channelState.lastReadAt).getTime();

    if (lastReadTimestamp == null) return false;

    const lastMessageTimestamp = new Date(channelState.lastMessageAt).getTime();

    return lastReadTimestamp < lastMessageTimestamp;
  },
  { memoizeOptions: { maxSize: 1000 } }
);

export const selectChannelLastMessageAt = (state, channelId) => {
  const readState = state.channels.readStatesById[channelId];
  if (readState.lastMessageAt == null) return null;
  return new Date(readState.lastMessageAt);
};

export const selectDmChannelFromUserId = (state, userId) => {
  const dmChannels = selectDmChannels(state);

  if (userId === state.me.user.id)
    return dmChannels.find(
      (c) => c.memberUserIds.length === 1 && c.memberUserIds[0] === userId
    );

  const userDmChannels = dmChannels.filter(
    (c) => c.memberUserIds.length <= 2 && c.memberUserIds.includes(userId)
  );

  if (userDmChannels.length > 1) throw new Error();

  return userDmChannels[0];
};

export const selectDmChannelFromUserIds = (state, userIds) => {
  const dmChannels = selectDmChannels(state);
  return dmChannels.find(
    (c) =>
      c.memberUserIds.length === userIds.length &&
      c.memberUserIds.every((id) => userIds.includes(id))
  );
};

export const selectAllChannels = createSelector(
  (state) =>
    Object.keys(state.channels.entriesById).map((id) =>
      selectChannel(state, id)
    ),
  (channels) => channels,
  { memoizeOptions: { equalityCheck: arrayShallowEquals } }
);

export const selectMemberChannels = createSelector(
  (state) => {
    if (state.me.user == null) return [];

    const blockedUserIds = state.users.blockedUserIds;

    const channels = Object.entries(state.channels.entriesById)
      .filter((entry) => {
        const c = entry[1];
        const me = state.me.user;

        if (c.isDeleted) return false;

        if (c.kind === "dm" && c.memberUserIds?.length === 2) {
          const memberId = c.memberUserIds.filter((id) => id !== me.id)[0];
          return !blockedUserIds.includes(memberId);
        }

        return c.memberUserIds?.includes(me.id);
      })
      .map(([id]) => selectChannel(state, id));

    return channels;
  },
  (state) => state.channels.readStatesById,
  sortChannelsByActivity,
  { memoizeOptions: { equalityCheck: arrayShallowEquals } }
);

export const selectDmChannels = createSelector(
  (state) => {
    const channels = Object.entries(state.channels.entriesById)
      .filter((entry) => !entry[1].delete && entry[1].kind === "dm")
      .map(([id]) => selectChannel(state, id));

    return channels;
  },
  (state) => state.channels.readStatesById,
  sortChannelsByActivity,
  { memoizeOptions: { equalityCheck: arrayShallowEquals } }
);

export const selectPublicChannels = createSelector(
  (state) =>
    state.channels.publicChannelIds
      .map((id) => selectChannel(state, id))
      .filter(Boolean),
  (state) => state.channels.readStatesById,
  sortChannelsByActivity,
  { memoizeOptions: { equalityCheck: arrayShallowEquals } }
);

export const selectStarredChannels = createSelector(
  (state) =>
    Object.keys(state.channels.starsByChannelId)
      .map((id) => selectChannel(state, id))
      .filter(Boolean),
  (state) => state.channels.readStatesById,
  sortChannelsByActivity,
  { memoizeOptions: { equalityCheck: arrayShallowEquals } }
);

export const selectIsChannelStarred = (state, id) =>
  selectChannelStarId(state, id) != null;

export const selectChannelMembers = createSelector(
  (state, channelId) => {
    const channel = state.channels.entriesById[channelId];
    if (channel == null || channel.isDeleted) return [];
    return channel.memberUserIds?.map((id) => {
      const user = selectUser(state, id);
      return { ...user, id, isOwner: id === channel.ownerUserId };
    });
  },
  (members) => members,
  { memoizeOptions: { equalityCheck: arrayShallowEquals } }
);

export const selectChannelStarId = (state, channelId) =>
  state.channels.starsByChannelId[channelId]?.id;

export const selectHasFetchedMessages = (state, channelId) =>
  state.channels.metaById[channelId]?.hasFetchedMessages ?? false;

export const selectHasAllMessages = (state, channelId) =>
  state.channels.metaById[channelId]?.hasAllMessages ?? false;

export const selectChannelAccessLevel = (state, channelId) => {
  const meta = state.channels.metaById[channelId];
  if (meta == null || meta.publicPermissions == null) return null;
  if (meta.publicPermissions.includes(Permissions.CHANNEL_JOIN)) return "open";
  if (meta.publicPermissions.includes(Permissions.CHANNEL_READ_MESSAGES))
    return "closed";
  if (meta.publicPermissions.length === 0) return "private";
  return "custom";
};

export const selectChannelHasOpenReadAccess = (state, channelId) => {
  const meta = state.channels.metaById[channelId];
  if (meta == null || meta.publicPermissions == null) return null;
  return meta.publicPermissions.includes(Permissions.CHANNEL_READ_MESSAGES);
};

export const selectCanAddChannelMember = (state, channelId) => {
  const meta = state.channels.metaById[channelId];
  if (meta == null || meta.permissions == null) return false;
  return meta.permissions.includes(Permissions.CHANNEL_ADD_MEMBER);
};

export const selectCanManageChannelInfo = (state, channelId) => {
  const channel = state.channels.entriesById[channelId];
  if (channel == null || state.me.user == null) return false;
  return channel.ownerUserId === state.me.user.id;
};

export default combineReducers({
  entriesById,
  metaById,
  readStatesById,
  starsByChannelId,
  publicChannelIds,
});

# CEISD Mobile — Design System Migration Guide (Sprint 2)

This adds the missing **design-system layer** that was making the frontend feel basic.
Nothing here is breaking: the theme *extends* your existing `shared/constants` `COLORS`,
and the components are new files in the previously-empty `mobile/components/`.

## 1. Where the files go

```
mobile/
├── theme/
│   └── theme.ts                ← from outputs/theme/theme.ts   (NEW)
├── components/
│   ├── Button.tsx              ← from outputs/components/       (NEW)
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── Avatar.tsx
│   ├── SegmentedControl.tsx
│   ├── ScreenHeader.tsx
│   ├── EmptyState.tsx
│   └── index.ts
└── screens/
    └── home/
        └── HomeScreen.tsx      ← from outputs/home/HomeScreen.tsx (REPLACES existing — reference migration)
```

> Keep your old `HomeScreen.tsx` as `HomeScreen.old.tsx` until you've confirmed the new one
> renders on your device. This protects the working build.

## 2. One prerequisite to verify

The components use `@expo/vector-icons` (Ionicons), which ships with Expo SDK 54 — no install needed.
Confirm it imports without error. If for any reason it's missing:
```
npx expo install @expo/vector-icons
```

## 3. The migration pattern (apply to each screen)

It's the same mechanical swap everywhere:

| Old (hardcoded)                                  | New (tokens / components)                     |
|--------------------------------------------------|-----------------------------------------------|
| `backgroundColor: '#F5F5F5'`                     | `backgroundColor: colors.background`          |
| `color: '#1D9E75'`                               | `color: colors.primary`                       |
| `fontSize: 16, fontWeight: '700'`                | `...type.h3`                                   |
| `padding: 16`                                    | `padding: spacing.lg`                         |
| `borderRadius: 12`                               | `borderRadius: radius.md`                     |
| hand-rolled shadow props                         | `...elevation('md')`                          |
| `<TouchableOpacity>` styled as a button          | `<Button title="…" onPress={…} />`            |
| `<View>` styled as a card                        | `<Card>…</Card>`                              |
| green pill `<View><Text>Tag</Text></View>`       | `<Badge label="Tag" />`                        |
| tab bar in HomeScreen                            | `<SegmentedControl … />`                       |
| circular profile image block                     | `<Avatar name={…} uri={…} />`                  |
| blank list when no data                          | `<EmptyState … />`                             |

Import at the top of any screen:
```ts
import { colors, spacing, radius, type, elevation } from '../../theme/theme';
import { Button, Card, Badge, Avatar, EmptyState } from '../../components';
```
(adjust `../../` to the screen's depth)

## 4. Suggested rollout order (highest visual impact first)

1. **LoginScreen** — first thing anyone sees
2. **EventCard + EventDetailScreen** — the most-viewed content
3. **ProfileScreen** — the "journey" screen, biggest wow factor
4. **MatchCard + MatchMeScreen** — the AI showcase
5. **TaskCard + MyTasksScreen**, then everything else

## 5. Verifying (your step — RN can't be tested off-device)

After dropping in the files:
```
npm run dev:mobile
```
Open on your device/Expo Go and check HomeScreen renders with the new tab switcher.
If the screen is blank, recall the SDK 54 lesson: confirm `registerRootComponent(App)`
is still being called explicitly in your entry file — the design system doesn't touch that,
but it's the usual suspect for a silent blank screen.

## 6. Optional polish (later)

To replace the system font with a real display font (recommended for that premium feel):
```
npx expo install @expo-google-fonts/sora expo-font
```
Load it once at app start, then in `theme.ts` set `fonts.display = 'Sora_700Bold'`.
Every heading across the app updates automatically because they all read from the token.

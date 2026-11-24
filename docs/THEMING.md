# Theming rules

How UI code in this app gets its look from the theme: stay inside the theme's tokens,
reuse what exists, and know when (and where) to add something new. Read this before
touching any style (styled components, `StyleSheet`, inline styles, style props), any
primitive in `src/ui/src/components/shared/` or `product.schema.json`.

The schema format itself (nodes, types, aliases, `follows`, `derive`, `inherits`, editor
metadata) and its versioning rules are documented by the theme engine
(`@orderingco/ordering-theme-engine`, the version pinned in `package.json`), in
`node_modules/@orderingco/ordering-theme-engine/docs/` (`schema-format.md`,
`creating-a-schema.md`). This page is about how this app uses it. The design decisions
behind the values are in `docs/theme/` (`decisions.md`, `tokens.md`, `components.md`,
`pages-and-visibility.md`; keys read through a variable in `readers.md`).

The web marketplace (website-marketplace-v26) follows the same rules with CSS; this page
mirrors its `docs/THEMING.md` where the two platforms agree.

## 1. The theme decides

- Every visual value comes from the theme: colors, spacing, radii, borders, shadows,
  typography, icon and control sizes, opacity, motion, images and what is shown. Nothing
  is hard-coded: no hex, `rgb()` / `rgba()`, no number for a length, font size, line
  height, shadow or duration, no `fontFamily` or `fontWeight`, in a styled component, a
  `StyleSheet`, an inline style or a prop like `size={14}`.
- The theme always arrives complete and valid: `theme.values` is the served theme (or
  the cached one, or none) completed by the engine's runtime (`complete` of
  `@orderingco/ordering-theme-engine/runtime`, in `src/theme/engine.ts`) with
  `src/theme.compiled.json`, the schema compiled by `pnpm theme:compile` (its defaults
  with the rule of each value), checked by api-core's own rules:
  - every key of the schema is there; one the theme leaves out is the default;
  - a value the app does not understand is the default, never empty: another kind than
    the default's, an option the schema does not list, an invalid color (a hex, `rgb()` /
    `rgba()` or `transparent`; an alias such as `{color.primary}` is not one), or null
    where the default is not null (borders and shadows may be null: none);
  - a number is clamped to the editor's `min` / `max` of its node, else to the format's
    range;
  - a text style, a border and a shadow are checked field by field: an invalid or
    missing field is the default's;
  - a key the schema lacks is dropped; a page's `sections` keep the theme's order with
    only that page's sections; an image is an `http(s)` URL or `''` (none: the app then
    shows its bundled image).

  Readers rely on it: do not re-check options or ranges, do not write fallbacks that
  repeat a default and do not use optional chains on the theme.
- The theme also arrives as React Native values: `theme.native` is its view (`toNative`
  of `@orderingco/ordering-theme-engine/native`, built once per theme), every value
  converted by its type in the schema (lengths in pt, a border as `borderWidth` /
  `borderStyle` / `borderColor`, a shadow as iOS `shadow*` and Android `elevation`, a text
  style as the font file of its weight with `lineHeight = size × line`, the tokens with
  Identity applied). Paint from the view through the helpers; read `theme.values` only to
  compute (comparisons, nulls, options, visibility).
- The theme is only `{ values, native, meta }` (`src/theme/engine.ts`). Never build one by
  spreading values (`{ ...theme, values: … }`): its view keeps the old values. Build it
  with `buildAppTheme(envelope)`, and never change the result: its objects are shared.
- One provider: `AppThemeProvider` (`src/theme/AppThemeContext.tsx`), from
  `styled-components/native`, at the top of `TemplateApp`; everything that paints is
  inside it.
- Where the theme comes from:
  - the binary paints `complete(compiled, null)` (the defaults of the schema version it
    was built with) until a served theme arrives, and the cached one on later launches
    (`src/theme/remote.ts`, one cache per project and schema version, read before the
    first frame);
  - the app asks for it itself: `GET {root}/theme?theme_version=2&product_type=marketplace_app&theme_schema_version=<compiled version>`
    (`RemoteThemeLoader`); a served theme equal to the cached one is kept as it is;
  - the logic submodule's version 1 theme is not read, and there is no version 1 map:
    what a project set in version 1 does not reach the app (`docs/theme/decisions.md`).
- What the theme sets is not overridden in the app. If something looks wrong with the
  defaults, fix the default in the schema, not the style.
- If no token or component property fits a spot, do not invent a value: say so (an
  exception, with its effect) and ask. A value off the scale is a design decision, not a
  coding one. An approved one goes in `theme-exceptions.json` with its reason.

## 2. Where values live

| Layer | What it is | Example |
|---|---|---|
| `tokens.<group>.<name>` | The shared vocabulary: literal values, same names in every product; numbers in pt | `color.surface`, `space.md`, `radius.lg`, `typography.h3` |
| Identity (`tokens.shadow_style`, `border_style`) | Theme-wide choices that move every property that `follows` them | one radius level for every box |
| `tokens.motion_style` | The theme's easing, and whether anything moves | `motion_style.enabled` |
| `components.<c>.base` | The properties of a component; defaults alias tokens | `card.base.background = {color.surface}` |
| `variants` / `appearances` / `sizes` / `shapes` / `colors` | Axes of a component; states (`pressed`, `disabled`…) only in `variants` and `appearances` | `button` sizes |
| `slots` | Another component a component contains, with its axes | a card's button |
| `scope` | What changes in other components inside a group | a group's tabs |
| `inherits` | A component that takes what the theme sets on its parent | a card-like component inherits `card` |
| `visibility`, `images`, `pages` | What is shown, the theme's images, screen sections | visibility key `business_card.fee` |

The app has no platforms (phone only), no `site` settings and does not read `modes`.

Token groups and levels (the engine's catalog; the schema sets the defaults):

| Group | Levels |
|---|---|
| `color` | brand (`primary`, `secondary` with `on_*`, `*_subtle`, `*_pressed`, `primary_text`), surfaces (`background`, `surface`, `surface_alt`, `overlay`, `on_overlay`, `inverse_surface`, `on_inverse`), text and lines (`text`, `text_muted`, `text_disabled`, `border`, `border_strong`), states (`success`, `warning`, `danger`, `info` with `on_*`, `*_subtle`, and `*_text` but for `info`), `disabled`, `rating`, `favorite` |
| `font` | `heading`, `body`: the families of the two roles |
| `typography` | `h1`–`h4` (heading font); `body_lg`, `body`, `body_sm`, `label`, `caption`, `button` (body font) |
| `space` | `none`, `xxs`, `xs`, `sm`, `md`, `lg`, `xl`, `xxl`, `xxxl` |
| `radius` | `none`, `xs`, `sm`, `md`, `lg`, `xl`, `xxl`, `full` |
| `size` (control height) | `sm`, `md`, `lg`, `xl` |
| `icon` | `sm`, `md`, `lg` |
| `border` | `thin`, `thick` |
| `shadow` | `none`, `sm`, `md`, `lg`, `xl` |
| `opacity` | `disabled`, `pressed` |
| `motion` | `fast`, `base`, `slow` |
| `layout`, `focus_ring` | page gutter and the listing's layout mode, focus ring |

Their values are the schema's defaults (`src/theme.compiled.json`) and a theme can change
them: code refers to the level, never to its number.

## 3. Reading the theme in code

Always through the helpers (`src/theme/helpers.ts`, `src/theme/sections.tsx`). Never read
`product.schema.json` from app code, and never copy a default value into the code. The
helpers return React Native values (numbers in pt, style objects); each has a template
twin (`…Css`) for styled-components templates, which need CSS text: a component never
writes a unit after an interpolation.

| Need | Object styles | Styled templates |
|---|---|---|
| A component's properties | `themePart(theme, 'button', 'sizes.md.height')` (its view); `themeValue(theme, 'tokens.layout.mode')` for a completed value to compute with | the object value, or the twins below |
| Color | `themeColor(theme, 'surface')` | `themeColor(theme, 'surface')` |
| Spacing, page sides | `themeSpace(theme, 'md')`, `themeGutter(theme)` | `spaceCss`, `gutterCss` |
| Radius, shadow, border (Identity applied; `{ fixed: true }` keeps the level) | `themeRadius`, `themeShadow`, `themeBorder`, `themeBorderWidth` | `radiusCss`, `shadowCss`, `borderCss` |
| Text (the font file of its weight, `lineHeight = size × line`, no `fontWeight`) | `themeText(theme, 'body', { weight })`; a role's file `themeFontFamily(theme, role, weight)` | `textCss` |
| A component's text or shadow from the view | `nativeTextStyle(look.text)`, `nativeShadowStyle(look.shadow)` | — |
| A component's box (background, border, shadow): the shadow only on an opaque background | `nativeBoxStyle(look)`, `isOpaque(color)` | — |
| Icon and control sizes | `themeIconSize`, `themeControlHeight` | `iconSizeCss`, `controlHeightCss` |
| Pressed and disabled opacity | `themeOpacity(theme, 'pressed')` | — |
| A component as a group sees it (the group's `scope` of choices, checkboxes, steppers…) | `themeScoped(theme, group, name)` | — |
| A control whose states have different borders (chip, category tile): the widest border's room in every state | `reservedBorder(looks)` | — |
| Motion (duration, easing; none when the theme turns motion off or the system asks to reduce motion) | `themeMotion(theme, 'base')` | — |
| Shown or hidden; screen sections | `themeVisible(theme, key)`; `usePageSections(page)` | — |
| Images (`{ uri }` or the bundled asset) | `themeImage(theme, key)`; the binary's own assets (icons, payment marks) `BUNDLED_IMAGES` (`src/theme/bundledImages.ts`) | — |
| How titles align (`section_header.align`) | `themeTitleAlign(theme)` | — |
| A section's title (text, color, alignment, the space under it) | `<SectionTitle>` (`shared/SectionTitle`; a component with its own title look passes `text` / `color`) | — |
| Room under a scroll for the bottom bar laid over it | `bottomBarClearance(theme, insets.bottom, buttons)` | — |
| Loading placeholders in the skeleton color | `Placeholder`, `PlaceholderLine`, `PlaceholderMedia` (`shared/Skeleton`, the app's own) | — |
| A payment method's icon (vector for cash and cards, the bundled mark for a brand) | `<PayMethodIcon gateway size color />` | — |
| A color that does not come from the theme (a business's ribbon) | `@orderingco/ordering-theme-engine/colors` (`onColor`, `legible`, `isLight`) | — |

If a helper is missing for a token group, add it next to its siblings in
`src/theme/helpers.ts` (with its template twin) rather than reading `theme.native` or
`theme.values` inline.

Object styles are built inside the component, memoized on the theme
(`useMemo(() => StyleSheet.create(...), [theme])`), never at module level.

Two rules the helpers do not enforce:

- **A shadow needs an opaque box under it.** Never put a shadow on an image or on a view
  without a background (a transparent PNG shows it through as a grey box on Android; iOS
  logs "cannot calculate shadow efficiently"): carry it on a box with a background and put
  the picture inside (`BusinessLogo`, the offer images, the category icon).
- **An icon inside `OButton` takes the button's size and ink** when it does not set its
  own: pass `<Icon name=… />` without `size` / `color` unless the design asks otherwise.

## 4. Reuse or create: the order to follow

Go down this list and stop at the first step that fits.

1. **The component already has the property.** The spot belongs to a component of the
   schema and that component has a property for it: read it (`themePart`). Example: a
   store card's name color is the `business_card` component's, not
   `themeColor(theme, 'text')`.
2. **A shared primitive already does it.** One purpose, one theme element:
   `OText`, `OButton`, `OIconButton`, `OIcon`, `OInput`, `OCheckbox`, `ChoiceMark` (every radio and
   check of the app: the `radio` of one choice or the `checkbox` of several), `ChoiceRow` (a row of a
   list of choices, a product's options and ingredients: the `choice` box with its `ChoiceMark`), `OModal`,
   `OBottomPopup`, `OSelect`, `OToast`, `OAlert`, `ONotice`, `PressableScale`,
   `SectionTitle`, `StableText`, `Skeleton`, `BusinessLogo` (`src/ui/src/components/shared/`),
   `BackButton` (the back of every header), `FilterChip` (every chip, payment methods and
   review choices included), `OrderContextPill` (the order type and moment, wherever they
   show), `OrderTypeSwitch` (the allowed order types as tabs, the header's `order_type` slot), `EditButton` (the edit button of
   a checkout block, the checkout's `edit` slot), `WalletRow` (a wallet of either checkout), `NavBar`,
   `SafeAreaViewWrapper` and the components grouped in `docs/theme/components.md`. Every
   choice list (languages, countries, dates, quantities…) is `OSelect`, a sheet with the
   menu's rows. Do not build a second version of one of these with its own styles.
3. **A token used directly.** Layout glue that should always move with the global scale
   and that nobody needs to change on its own: the gap between blocks of a screen
   (`space.xl`), the rhythm between form fields (`space.md`), the screen's sides
   (`themeGutter`), the color of a plain heading (`color.text`).
4. **A new property on an existing component.** The spot is a distinct visual part of a
   component and a theme author could reasonably want it different from the token. Add
   the property to that component in the schema, with a default that aliases a token
   (`{space.sm}`, `{color.surface}`), never a literal unless the value is truly its own (a
   size with its `min` / `max`).
5. **A new component.** A reusable UI piece with its own look that no component covers. A
   card-like component `inherits` `card`; the components it contains go in `slots`; a
   group that changes its children uses `scope`.

Never create a new **token**. Token names are a fixed catalog shared by every product and
api-core rejects names outside it. A missing level (another space step, another icon
size) is a change to the engine and the editor: raise it and ask, do not work around it.

### Reuse across components

- Prefer a slot to restyling a contained component: a button inside a card is a slot
  pointing to `button` with its size, appearance and color, not a custom button.
- Prefer `inherits` to copying a parent's properties: the child declares only what it
  uses, and what the theme sets on the parent applies to it.
- Prefer `scope` to per-place overrides: a group that wants its tabs or buttons different
  says so in its `scope`.
- Two components that should look alike alias the same token in their defaults; they do
  not read each other's properties.

## 5. Picking the right token

Use the token that names the purpose, not the one with the right value today.

**Surfaces**
- `background` is only the screen canvas (home, listings, account screens).
- Cards and anything that floats (modals, sheets, dropdowns, toasts) are `surface`.
- Bands and quiet fills are `surface_alt`.

**Text and lines**
- Plain text is `text`; secondary text and placeholders are `text_muted`.
- `text_disabled` is for disabled text and for decorative icons; `disabled` is the fill or
  line of a disabled control (a solid button's background, an outline button's border).
- Separators and card borders are `border`.
- `border_strong` is for form-control borders (input, select, checkbox, radio, switch
  off) and non-line fills (spinner).
- Loading placeholders (skeletons) use the skeleton primitives; a component does not color
  its skeletons.

**Color on color**
- `on_*` is text on that color's fill (button, badge, toast).
- `*_text` is that color used as text on the screen (errors, amounts, states); it is the
  legible one.
- `primary` is the brand, selection and progress; `primary_subtle` its soft fill.
- `on_overlay` is text and icons over photos.
- `overlay` is the scrim behind modals and sheets.
- Icons, borders and fills keep the plain color.
- `rating` is stars; `favorite` is the favorite mark.

**Translucency:** a color is opaque unless its node says `alpha: true` in its editor
metadata. Only then can its default be translucent, and a translucent box drops its shadow
(`nativeBoxStyle`).

**Typography**
- Headings use `h1`–`h4`; body copy uses `body_lg`, `body`, `body_sm`, `label`,
  `caption`, `button`.
- The style follows the theme, not the place: a screen's title can carry an `h4` style.
- `line` is a ratio of the size, not pt.
- Texts of the same role look the same on every screen; each role reads one place of
  the theme, never a preset picked by the screen:

  | Role | Reads |
  |---|---|
  | Screen title | `header.title` (`NavBar`, the listing and storefront head) |
  | Section title (page sections, checkout sections, menu categories) | `section_header.title` through `SectionTitle`, or the hosting component's title aliased to the same level (`checkout.section_title`) |
  | Card title (business, product, cart, order) | the card's `name` (one custom style shared by `business_card`, `product_card`, `cart`, `order_card`, `checkout.business_name`) |
  | A highlighted value (an order's status and estimate) | at most `h3` (`order_details.status_text`, `h4` by default) |
  | Metadata (a card's time, fee, distance, rating) | the card's `meta` in `meta_color` (`text_muted`) |
  | The head's address | `header.address_text` |
  | The head's order options (order type, moment) | `header.context_text` through `OrderContextPill`; drawn as a button (`header.base.context_style`), the button's own text |
  | Body copy, leads under a title | `body` |
  | Tab bar labels, badges, captions | `bottom_nav.label_text`, `caption` |

- A label that turns bold when selected (tabs, category tiles) keeps its bold width:
  `StableText`. Selecting changes the look, never the layout.

**Sizes**
- Icons use `icon` levels; control heights use `size` levels (`themeControlHeight`).
- Touch targets are at least 44 pt.
- A bar pinned to the bottom (tab bar, cart and checkout bars, the chat's composer) keeps the system inset under its content or at least `bottom_nav.min_bottom_space`, whichever is larger: `themeBottomSpace` (`bottomBarBox` for a bar that sets its own height). The inset is 0 on Android with gestures.
- Radii and shadows use their levels; Identity may replace the level, which the helpers
  handle:
  - a state (pressed, focus) or a round shape passes `{ fixed: true }` to keep its own
    level;
  - `none` and `full` radii never change.

**Interaction**
- Only what can be tapped has press feedback (`opacity.pressed`, a state's look from the
  theme).
- Everything else stays still.
- A state (pressed, selected) never moves or resizes its control: its border room is
  reserved in every state (`reservedBorder`, see-through where a state has none) and a
  bolder label keeps its bold width (`StableText`).

**Headers and page sides**
- Every screen's header is `NavBar` (or the listing and storefront head, which shares its
  pieces): the bar's content sits on the page gutter, the back is `BackButton` (the glyph of
  `header.base.back_icon`, which starts at the gutter, like every text and card below it)
  and the title follows it by `space.sm`. The listing and storefront head paints the bar's
  background, line and shadow (and the safe-area inset above it) only when the theme asks
  for it (`header.base.fill_listing`); the home screen's page can then start over it with
  rounded top corners (`header.base.sheet_radius`).
- A bottom bar's actions are `FloatingButton`'s: the main button is the `bottom_bar`
  component's `button` slot and a second one its `secondary` slot; with
  `bottom_bar.base.joined`, they and a total or a picture beside the main button share one
  shape.
- A row of chips (business types, filters, address tags, driver tips, payment methods) is
  one row that scrolls sideways, never wrapped.
- Every card carries its radius on the box that paints its background and shadow, and a
  business's logo is `BusinessLogo` in the business card's frame (radius, background,
  `logo_shadow`) wherever it shows (business, order and home order cards, order details,
  reviews); without a logo, the theme's placeholder sits inside that frame on `surface_alt`.
- A screen's sections are split by one separator, the divider `band` out to the page sides
  (checkout, multi checkout, order details).
- An order's status is a soft badge in its tone (`*_subtle` fill, `*_text` ink): it informs,
  it is not a selected chip.
- Dates and times are written by the project's date utility (`parseDate` of `useUtils`, the
  project's `dates_general_format`, or its `dateFormat` / `timeFormat` part), never with a
  format of the screen's own: an order's date reads the same on its card, on the home and
  in its details.
- A card that opens something is pressable as a whole; a row never trades its title's room
  for a button (it must hold on a 360 pt phone). A ghost link starts where the text above
  it starts: its padding is pulled into the side.

**Motion:** durations and easing come from `motion` / `motion_style` and the component's
own motion properties, through `themeMotion`.

## 6. Adding to the schema

When step 4 or 5 applies, in the same pull request:

1. Add the node to `product.schema.json` with its `$type` and its default:
   - the default aliases a token (`{color.x}`, `{space.x}`, `{radius.x}`, `{shadow.x}`,
     `{typography.x}`, `{icon.x}`);
   - a dimension says its `scale`;
   - a shadow, radius or border that should follow Identity says `follows`;
   - a translucent color says `alpha: true`.
2. Add its editor metadata (`$extensions["co.ordering.editor"]`): label key and default
   text, group, `order`, control, and `min` / `max` / `step` / `unit` for numbers. The
   editor's rules are checked by `pnpm theme:validate`.
   - The dashboard translates the editor from its own catalog. A new label key
     (`BUILDER_THEME_PROP_…`) shows its default English text until the dashboard adds it
     in every language: send the dashboard each new key with its default text
     (`docs/theme/editor-labels.md`).
3. Bump `version` once the current one is published to production: a published version
   is immutable (api-core answers 409 `schema.version_exists`). Which number to bump, and
   how saved themes follow, is in the engine's docs (see the top of this page):
   `creating-a-schema.md` section 6 and `schema-format.md` sections 13–15.
   - Installed apps keep asking for the schema version they were built with: the new
     version must be published to production **before** the build that ships it,
     and a theme of the new version must cut down cleanly to the old one.
   - Publishing is the pipeline's job, as on the web: never run `pnpm theme:publish`
     by hand. Every merge to `main` publishes it to production (the same version
     with the same content answers `unchanged`) and then has the Builder clone its
     base of this repository again, so the next build is made from `main`
     (`.github/workflows/theme-publish.yml`, `pnpm theme:publish:production` with the
     organization's `THEME_PUBLISH_API_PRODUCTION` variable and
     `THEME_PUBLISH_KEY_PRODUCTION` secret, shared with the web); pull requests check it
     with a dry run against production (`THEME_PUBLISH_KEY_PRODUCTION`).
   - Locally nothing is published: either the app paints the local schema's defaults
     (`pnpm theme:compile`; without a served theme it paints `complete(compiled, null)`),
     or the schema is registered in the local API with api-core's
     `php artisan ordering:theme-schema <path to product.schema.json>` to edit a theme of
     it from the local Dashboard.
4. Run `pnpm theme:compile` (it writes `src/theme.compiled.json`: the defaults, the rules
   the app completes the theme with, `product_type` and `version`), then
   `pnpm theme:validate`, `pnpm theme:verify`, `pnpm theme:guard` and
   `pnpm theme:extremes`.
5. Read it through a helper (section 3), and cover it in a test. A key read through a
   variable or a whole look goes in `docs/theme/readers.md`.
6. Update this page if the change touches anything it describes (section 9).

## 7. Fonts

The ten catalog fonts are bundled as static files, weights 400/500/600/700, one file per
weight (`src/assets/fonts/`, linked in `Info.plist` and the Xcode project, copied to
`android/app/src/main/assets/fonts/`). A file's name and its PostScript name are
`<FamilyWithoutSpaces>-<Weight>` (`OpenSans-SemiBold`), which is what `toNative` paints
with. Lato has no 500/600: its Medium and SemiBold files are its Regular and Bold. A
weight is painted by its file (`themeText` with `weight`, `themeFontFamily`), never by
`fontWeight`.

## 8. Don'ts

- No literals in styles or style props: no hex, `rgb()` / `rgba()`, number for a length,
  font size, line height, shadow, opacity or duration, no font name. A literal is only
  acceptable when it is not a design value (`0`, `'100%'`, flex ratios) or when it is a
  recorded, approved exception in `theme-exceptions.json`. `pnpm theme:guard` fails on
  the rest in CI.
- No module-level `StyleSheet.create` with theme values: it never sees a theme change.
- No `fontFamily` or `fontWeight` in a component: the text helper picks the file.
- No colors computed from other colors in a component (`darken`, `lighten`, `mix`):
  derived colors are declared in the schema (`derive`) and served ready. A color that does
  not come from the theme goes through the engine's color functions
  (`@orderingco/ordering-theme-engine/colors`).
- No reading `theme.native…` or `theme.values…` inline when a helper exists; no
  converting a theme value in a component (a shadow or text built from its values): the
  view has it.
- No second implementation of a primitive (section 4.2); no picker library and no list
  that opens in place.
- No per-component copy of a token's value "to be safe"; no second theme provider; no
  optional chains on the theme.
- No `defaultProps` on function components: defaults go in the destructuring.
- No press feedback on what cannot be tapped.
- No new token names; no schema key without its default, editor metadata and the rest of
  section 6.

## 9. Keeping this page true

This page describes the rules and the theme **as they are now**. It must match
`product.schema.json` and the helpers at all times.

- **Same pull request:** a change that touches what this page describes updates it in
  that pull request. That covers:
  - the schema: token groups or levels, a component's parts, `follows`, `inherits`,
    `slots`, `scope`;
  - a helper, or a shared primitive in `src/ui/src/components/shared/`;
  - a rule about which token fits which purpose.
- **Rewrite in place:**
  - edit the sentence that changed, so the page reads as if it had always said the new
    thing;
  - delete what no longer exists.
- **Not a changelog:**
  - no dates, versions or "was / now / previously / new" notes;
  - no lists of past changes or decisions.

  History lives in git and in the commits; decisions in `docs/theme/decisions.md`.
- **Specific rules only:** add a rule only if it applies across the codebase. A decision
  about one screen goes in that screen's code or in `docs/theme/`, not here.
- **Point, don't copy:** prefer pointing to the source over copying values:
  - level names, not their numbers;
  - the helper's file, not its body.

  What is not copied cannot go stale.

# Schema keys and their readers

`keys.mjs` (the plugin's reader check) matches paths as text. The keys below are read
through a variable or a whole look, so it does not see them; each has a reader:

| Key | Read in |
|---|---|
| `button.colors.<color>.{on,ink,subtle}` (18) | The engine builds `button.variants.<color>.<appearance>` from these tones; `shared/OButton.tsx` reads the variants |
| `alert.variants.<variant>.icon_color` | `shared/ONotice.tsx` (`look.icon_color`) |
| `modal.base.background` | `shared/OModal.tsx` (`components.modal.base.background`) |
| `checkbox.base.size` | `ProductIngredient/index.tsx`, `MultiCartsPaymethodsAndWallets/index.tsx` |
| `radio.base.size`, `radio.base.unchecked` | `MomentOption/RadioMark.tsx` |
| `choice.base.background` | `MomentOption/RadioMark.tsx`, `OrderTypeSelector/index.tsx` (through `nativeBoxStyle`) |
| `stepper.base.button_appearance` | `ProductForm/index.tsx`, `ProductItemAccordion/CartProductCard.tsx` |
| `business_card.base.border` | `BusinessController/styles.tsx` (through `nativeBoxStyle`) |
| `business_card.base.meta_icon_size` | `BusinessController/BusinessCard.tsx` (`card.meta_icon_size`: the time, delivery fee and distance icons) |
| `product_option.base.background` | `ProductOption/styles.tsx` |
| `profile_photo.base.placeholder_icon_size` | `UserProfileForm/index.tsx` |
| `wallet_transaction.base.credit_background` | `WalletTransactionItem/styles.tsx` |
| `help_topic.base.chevron_color`, `chevron_size` | `Help/index.tsx` |
| `order_details.base.progress_size`, `driver_avatar_size` | `OrderDetails/index.tsx` |
| `offer_card.base.background`, `code_background` | `Promotions/styles.tsx` |
| `search_bar.base.background`, `…disabled.background` | `SearchBar/index.tsx` |
| `rating.base.empty_color` | `BusinessReviews/Item.tsx` |
| `rating_scale.base.mark` | `ReviewOrder/ReviewForm.tsx` |
| `cookie_banner.base.background` | `CookieConsentBanner/styles.tsx` |
| `student_selector.base.background` | `StudentSelector/styles.tsx` |
| `switch.base.{on,off,thumb}` | `Notifications/index.tsx` (`toggle.*`) |
| `business_types.base.layout`, `grid_columns` | `BusinessTypeFilter/index.tsx` (`types.base.layout`: pills, pills with the type's image, tiles, or the home screen's grid of `types.base.grid_columns` columns) |
| `business_header.base.details_layout`, `details_order`, `details_label_color` | `BusinessBasicInformation/BusinessDetailsBox.tsx` (`header.details_layout`, `header.details_order`, `header.details_label_color`) |
| `product_modal.base.close_icon`, `close_position`, `favorite_position` | `ProductForm/index.tsx` (`modal.base.*`) |
| `stepper.base.background` | `ProductForm/styles.tsx`, `ProductItemAccordion/CartProductCard.tsx` (`stepper.background`) |
| `header.scope.tabs.variants.pill.*` (12) | `Forms/Tabs.tsx` (a group's `scope.tabs` is the look of its tabs), for `shared/OrderTypeSwitch.tsx` (`group='header'`) |
| `floating_button.base.url`, `background`, `placement` | `SupportBubble/index.tsx` (`link.*`) |

Every other key is found by `keys.mjs`. A new key read the same way is added here in the
same pull request.

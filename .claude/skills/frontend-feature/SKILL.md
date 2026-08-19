---
name: frontend-feature
description: Xây hoặc sửa giao diện React trong frontend/. Dùng bất cứ khi nào công việc động tới component, màn hình, page, form, Redux slice, state của store, lời gọi API từ trình duyệt, hoặc bất kỳ text nào người dùng thấy — kể cả "thêm màn hình cho X", "hiển thị Y lên UI", "nối Z vào", đổi style component có sẵn (add a screen for X, show Y in the UI, wire up Z, restyle components).
---

# Xây tính năng frontend

App theo atomic design cùng Redux Toolkit. Các tầng đã có sẵn — đặt code mới vào đúng
tầng thay vì dựng một cấu trúc song song.

## Các tầng atomic design

| Tầng | Đường dẫn | Được giữ state? | Được chạm store? |
|---|---|---|---|
| atoms | `src/components/atoms/` | Không — chỉ props | **Không bao giờ** |
| molecules | `src/components/molecules/` | Không — chỉ props | **Không bao giờ** |
| organisms | `src/components/organisms/` | Có, state UI cục bộ | **Có** — tầng duy nhất được phép |
| templates | `src/components/templates/` | Không — chỉ bố cục | **Không bao giờ** |
| pages | `src/pages/` | Không — ghép organism vào template | Không |

Atom là một phần tử đơn (`Button`, `Input`, `Text`, `Spinner`). Molecule gộp vài atom
thành một đơn vị có nhãn (`FormField`, `ItemRow`). Organism là các khối có ý nghĩa và
đã nối vào store (`ItemList`, `ItemForm`, `HealthBanner`). Template thuần bố cục. Page
chỉ ghép organism vào template, không làm gì thêm.

Nếu một component cần `useAppSelector`, nó là organism. Đẩy quyền truy cập store xuống
molecule là cách phổ biến nhất làm hỏng cấu trúc này — hãy truyền dữ liệu xuống bằng
props.

## Quy tắc quan trọng nhất

**Không hardcode chuỗi hiển thị cho người dùng, ở bất cứ đâu.** Mọi mẩu text người ta
đọc được đều nằm trong `src/constants/strings.ts`, nhóm theo màn hình render nó.

```tsx
<Button>Thêm mục</Button>                    // sai
<Button>{STRINGS.items.addAction}</Button>   // đúng
```

Áp dụng cho nhãn, placeholder, tiêu đề, trạng thái rỗng, text đang tải, thông báo lỗi,
và chữ trên nút. Test cũng theo quy tắc đó: assert vào `STRINGS.items.empty`, không bao
giờ vào chuỗi viết thẳng.

### File hằng số nào chứa gì

| File | Chứa |
|---|---|
| `src/constants/strings.ts` | Toàn bộ text người đọc được |
| `src/constants/api.ts` | Đường dẫn endpoint, HTTP method, header, mã lỗi backend |
| `src/constants/config.ts` | Tên slice, giá trị trạng thái request, mặc định phân trang, các số ma thuật khác |

Import từ barrel `src/constants`
(`import { STRINGS, SLICE } from '../../constants'`).

**Ranh giới:** tên class CSS và giá trị thuộc tính `data-*` là cấu trúc, không phải nội
dung, nên chúng ở lại trong code. Mọi thứ người dùng đọc được thì không.

## Các bước cho một tính năng mới

1. **Kiểu.** Thêm model vào `src/types/models.ts`, khớp từng field với schema Pydantic
   ở backend. Các kiểu envelope (`DataResponse`, `PageResponse`) đã có sẵn trong
   `src/types/api.ts` — tái dùng chúng.
2. **Hằng số.** Thêm đường dẫn vào `API_ROUTES` trong `src/constants/api.ts`, toàn bộ
   text vào `STRINGS`, và tên slice vào `SLICE` trong `config.ts`.
3. **Lời gọi API.** Thêm vào `src/api/endpoints.ts` dùng `apiClient`. Không bao giờ gọi
   `fetch` trực tiếp — `apiClient` lo phần prefix, header JSON, xử lý 204, và chuyển
   envelope lỗi của backend thành `ApiError`.
4. **Slice.** Tạo `src/store/slices/<feature>Slice.ts` với `createSlice` và
   `createAsyncThunk`. Đặt tên thunk theo dạng `` `${SLICE.x}/action` ``. Theo dõi một
   field `RequestStatus` và so sánh với `STATUS.*`, không bao giờ so với `'loading'`
   viết thẳng. Đăng ký reducer trong `src/store/index.ts`.
5. **Component.** Xây từ dưới lên: tái dùng atom có sẵn trước khi thêm atom mới. Export
   mỗi component mới từ barrel `index.ts` của tầng nó.
6. **Page.** Ghép các organism bên trong `PageTemplate`.
7. **Test.** Dùng `renderWithStore` từ `src/test/utils.tsx` — nó dựng store mới cho mỗi
   test. Giả lập network bằng `vi.stubGlobal('fetch', ...)` trả về đúng dạng envelope
   thật (`{ data, meta }` hoặc `{ error: { code, message } }`).

## Truy cập store

Luôn dùng các hook đã gắn kiểu từ `src/store/hooks.ts` (`useAppDispatch`,
`useAppSelector`) — không dùng `useDispatch` / `useSelector` trần, vì chúng làm mất kiểu.
Chọn state bằng hằng slice: `useAppSelector((state) => state[SLICE.items])`.

Dispatch thunk trong effect và handler là promise trôi nổi; thêm tiền tố `void` để thể
hiện rõ đó là chủ ý.

## Kiểm chứng

```bash
cd frontend
npm test && npm run typecheck && npm run lint
```

`erasableSyntaxOnly` đang bật: không constructor parameter property, không `enum`,
không `namespace`. Dùng object `as const` cộng một union suy ra từ nó thay cho enum.

---
name: frontend
description: Xây hoặc sửa giao diện React trong frontend/, cả phần thi công lẫn phần thiết kế hình ảnh. Dùng bất cứ khi nào công việc động tới component, màn hình, page, form, Redux slice, state của store, lời gọi API từ trình duyệt, bất kỳ text nào người dùng thấy, hoặc bất cứ quyết định nào về bảng màu, typography, bố cục và thẩm mỹ — kể cả "thêm màn hình cho X", "hiển thị Y lên UI", "nối Z vào", "làm lại giao diện", đổi style component có sẵn (add a screen for X, show Y in the UI, wire up Z, restyle, visual design, aesthetic direction, typography, layout).
license: Điều khoản đầy đủ trong LICENSE.txt
---

# Frontend

Skill này có hai nửa, và hầu hết công việc chỉ cần một nửa:

| Việc | Đọc phần |
|---|---|
| Thêm component, slice, form, nối API, sửa text | **Phần A — Thi công** |
| Màn hình mới, làm lại UI, chọn màu/chữ/bố cục | **Phần A + Phần B** |

Màn hình mới thì luôn cần cả hai: Phần B quyết định nó *trông* thế nào, Phần A quyết
định code nằm ở đâu. Đừng bắt đầu gõ code cho một màn hình mới trước khi đã đi qua
Phần B.

---

# Phần A — Thi công

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

---

# Phần B — Thiết kế hình ảnh

> **Đọc `.claude/rules/design-system.md` trước.** Dự án này **đã có** một định hướng
> hình ảnh đã chốt: sáng và thoáng, nền trắng ngà, panel cam pastel, một màu nhấn cam
> duy nhất, `--font-mono` cho mọi con số, toàn bộ token nằm trong `frontend/src/index.css`.
> Phần B bên dưới là cách tư duy khi phải **ra quyết định thẩm mỹ mới**; nó không cho
> phép bỏ qua hệ thống đang có. Trong repo này, phần lớn công việc là *áp dụng* hệ
> thống đó cho một màn hình mới, không phải phát minh hệ thống thứ hai. Chỉ khi người
> dùng yêu cầu rõ ràng một định hướng mới thì mới dùng Phần B ở dạng đầy đủ.

Hãy tiếp cận việc này với tư cách design lead của một studio nhỏ nổi tiếng vì luôn cho mỗi khách hàng một bản sắc thị giác không thể nhầm với bất kỳ ai khác. Khách hàng này đã từ chối những đề xuất mang cảm giác rập khuôn, và họ đang trả tiền cho một quan điểm riêng: hãy ra những lựa chọn có chủ đích và có lập trường về bảng màu, typography, và bố cục, riêng cho đề bài này, và chấp nhận một rủi ro thẩm mỹ thật sự mà bạn có thể biện minh được.

## Bám vào chủ thể

Nếu đề bài chưa chốt sản phẩm hoặc chủ thể là gì, hãy tự chốt trước khi thiết kế: nêu tên một chủ thể cụ thể, đối tượng người dùng của nó, và nhiệm vụ duy nhất của trang, rồi nói rõ lựa chọn của bạn. Nếu trong bộ nhớ của bạn có thông tin về sở thích của người dùng, bối cảnh thứ họ đang xây, hoặc các thiết kế bạn từng làm — hãy dùng đó làm gợi ý. Thế giới của chính chủ thể đó — vật liệu, dụng cụ, hiện vật, và ngôn ngữ riêng của nghề — là nơi những lựa chọn có cá tính bắt nguồn. Hãy xây bằng nội dung và chủ đề thật của đề bài xuyên suốt.

## Nguyên tắc thiết kế

Với thiết kế web, phần hero là một luận đề. Hãy mở đầu bằng thứ đặc trưng nhất trong thế giới của chủ thể, dưới bất kỳ hình thức nào hợp lý với nó: một dòng tiêu đề, một hình ảnh, một animation, một demo chạy thật, một khoảnh khắc tương tác. Hãy chủ đích với lựa chọn đó: một con số lớn kèm nhãn nhỏ, vài chỉ số phụ trợ, và một dải gradient nhấn — đó là câu trả lời mẫu, chỉ dùng nếu nó thật sự là phương án tốt nhất.

Typography mang cá tính của trang. Hãy ghép font tiêu đề và font nội dung một cách có chủ đích, đừng dùng lại đúng những họ font bạn sẽ với tay lấy cho bất kỳ dự án nào khác, và đặt một thang chữ rõ ràng với độ đậm, độ rộng, và giãn cách có chủ ý. Hãy làm cho chính cách xử lý chữ trở thành một phần đáng nhớ của thiết kế, không phải một phương tiện trung tính để chuyển tải nội dung.

Cấu trúc chính là thông tin. Các thiết bị cấu trúc — đánh số, eyebrow, đường phân cách, nhãn — phải mã hóa một điều gì đó đúng về nội dung, chứ không phải để trang trí. Nhiều thiết kế chung chung dùng số thứ tự (01 / 02 / 03), nhưng cách đó chỉ hợp khi nội dung thực sự là một chuỗi — như một quy trình có thật hoặc một dòng thời gian có kiểu, nơi thứ tự mang thông tin người đọc cần. Hãy tự hỏi những lựa chọn kiểu đánh số như vậy có thật sự hợp lý không trước khi đưa vào.

Dùng chuyển động một cách có chủ đích. Hãy nghĩ xem animation có thể phục vụ chủ thể ở đâu và có nên có không: một chuỗi khi tải trang, một hiệu ứng lộ ra khi cuộn, vi tương tác khi hover, không khí nền. Một khoảnh khắc được dàn dựng thường có sức nặng hơn nhiều hiệu ứng rời rạc; hãy chọn theo điều mà định hướng đòi hỏi. Tuy nhiên, đôi khi ít lại là nhiều, và animation thừa góp phần tạo cảm giác thiết kế do AI sinh ra.

Cho độ phức tạp khớp với tầm nhìn. Hướng maximalist cần thi công công phu; hướng tối giản cần sự chính xác trong giãn cách, chữ, và chi tiết. Sự thanh lịch nằm ở việc thực thi tốt tầm nhìn đã chọn.

Cân nhắc kỹ phần chữ viết. Nhiều khi đề bài thiết kế không có nội dung thật, và bạn phải tự viết copy. Copy có thể làm thiết kế nghe rập khuôn y như bản thân thiết kế. Xem mục viết lách bên dưới để biết thêm.

## Quy trình: brainstorm, khám phá, lên kế hoạch, phê bình, xây, phê bình lần nữa

Để hiệu chỉnh: thiết kế do AI sinh ra hiện đang tụ về ba kiểu nhìn: (1) nền kem ấm (gần #F4F1EA) với font serif tiêu đề tương phản cao và một màu nhấn đất nung; (2) nền gần đen với một màu nhấn xanh lá acid hoặc đỏ son duy nhất; (3) bố cục kiểu báo khổ rộng với đường kẻ mảnh, bo góc bằng không, và các cột dày đặc kiểu báo giấy. Cả ba đều hợp lệ với một số đề bài, nhưng chúng là mặc định chứ không phải lựa chọn, và chúng xuất hiện bất kể chủ thể là gì. Ở đâu đề bài đã chốt một định hướng hình ảnh, hãy theo đúng thế — lời của đề bài luôn thắng, kể cả khi nó yêu cầu đúng một trong ba kiểu này. Ở đâu đề bài để ngỏ một trục, đừng tiêu quyền tự do đó vào một trong các mặc định trên. Cũng như một nhà thiết kế được thuê, thường có một sự cân bằng cẩn thận giữa việc làm thứ mình giỏi và coi mỗi dự án là cơ hội để thử nghiệm và học.

Làm hai lượt. Lượt một, brainstorm một bản kế hoạch thiết kế ngắn dựa trên đề bài của người dùng: tạo một hệ token gọn gồm màu, chữ, bố cục, và điểm ký. Màu: mô tả bảng màu bằng 4–6 giá trị hex có tên. Chữ: font cho từ 2 vai trò trở lên (một font tiêu đề có cá tính dùng dè sẻn, một font nội dung bổ trợ, và một font tiện ích cho chú thích hoặc dữ liệu nếu cần). Bố cục: một ý tưởng bố cục, dùng mô tả một câu và wireframe ASCII để phác và so sánh. Điểm ký: yếu tố độc nhất mà trang này sẽ được nhớ tới, thể hiện đề bài một cách phù hợp.

Sau đó soi lại bản kế hoạch đó với đề bài trước khi xây: nếu phần nào đọc lên giống thứ mặc định chung chung mà bạn sẽ tạo ra cho bất kỳ trang tương tự nào (thử chạy qua một prompt tương tự xem có ra chỗ giống vậy không) thay vì một lựa chọn dành riêng cho đề bài này — hãy sửa phần đó, và nói rõ bạn đổi gì và vì sao. Chỉ sau khi đã xác nhận được mức độ riêng biệt của bản kế hoạch thì mới bắt đầu viết code, theo đúng bản kế hoạch đã sửa và suy ra mọi quyết định về màu và chữ từ nó.

Khi viết code, cẩn thận với độ ưu tiên của CSS selector. Rất dễ sinh ra các class CSS triệt tiêu lẫn nhau (đặc biệt giữa selector theo kiểu như `.section` và selector theo phần tử như `.cta`). Chuyện này hay xảy ra với padding/margin giữa các section.

Cố gắng thực hiện phần lớn việc lên kế hoạch và lặp này trong suy nghĩ, và chỉ trình ý tưởng cho người dùng khi bạn đủ tự tin là nó sẽ làm họ hài lòng.

## Tiết chế và tự phê bình

Hãy tiêu sự táo bạo vào một chỗ duy nhất. Để yếu tố ký là thứ đáng nhớ duy nhất, giữ mọi thứ xung quanh nó im lặng và kỷ luật, và cắt bỏ mọi trang trí không phục vụ đề bài. Không dám mạo hiểm bản thân nó cũng là một rủi ro! Hãy xây tới một sàn chất lượng mà không cần tuyên bố: responsive xuống tới mobile, focus bàn phím nhìn thấy được, tôn trọng reduced motion. Tự phê bình công việc của mình trong lúc xây, chụp màn hình nếu môi trường của bạn hỗ trợ — một tấm hình đáng giá 1000 token. Nhớ lời khuyên của Chanel: trước khi ra khỏi nhà, soi gương và bỏ bớt một món phụ kiện. Người sáng tạo có trí nhớ và luôn cố làm thứ gì đó mới, nên nếu bạn có chỗ để ghi nhanh vài dòng về những gì đã thử, nó sẽ giúp bạn ở các lượt sau.

## Nói thêm về chữ viết trong thiết kế

Chữ xuất hiện trong một thiết kế vì một lý do: để dễ hiểu hơn, và nhờ vậy dễ dùng hơn. Chúng là vật liệu thiết kế, không phải đồ trang trí. Hãy mang vào copy đúng mức chủ đích như bạn mang vào giãn cách và màu sắc. Trước khi viết bất cứ chữ nào, hãy hỏi thiết kế này cần nói gì, và nói thế nào thì giúp người dùng đi qua trải nghiệm tốt nhất.

Viết từ phía người dùng cuối của màn hình. Gọi tên mọi thứ theo cái người ta điều khiển và nhận ra, không bao giờ theo cách hệ thống được xây. Một người quản lý thông báo, chứ không phải cấu hình webhook. Mô tả một thứ làm gì bằng lời lẽ giản dị thay vì rao bán nó. Cụ thể luôn tốt hơn thông minh.

Mặc định dùng thể chủ động. Một control phải nói đúng điều sẽ xảy ra khi dùng nó: "Lưu thay đổi", không phải "Gửi". Một hành động giữ nguyên tên xuyên suốt cả luồng, nên nút ghi "Phát hành" thì sinh ra toast ghi "Đã phát hành". Từ vựng của một giao diện là biển chỉ đường cho người đang đi trong sản phẩm. Sự gắn kết và nhất quán là cách người ta học đường đi lối lại.

Coi lỗi và trạng thái rỗng là những khoảnh khắc để chỉ đường, không phải để làm màu. Hãy giải thích chuyện gì đã sai và sửa thế nào, bằng giọng của giao diện chứ không phải giọng của một con người. Thông báo lỗi không xin lỗi, và không bao giờ mập mờ về chuyện đã xảy ra. Một màn hình trống là một lời mời hành động.

Giữ giọng văn trò chuyện và có tinh chỉnh: động từ giản dị, viết hoa như câu thường, không chữ thừa, tông khớp với thương hiệu và đối tượng. Để mỗi phần tử làm đúng một việc. Nhãn thì làm nhãn, ví dụ thì minh họa, và không có gì lặng lẽ kiêm hai vai.

Trong repo này, phần "chữ viết" ở trên đi thẳng vào `src/constants/strings.ts` — xem
Phần A. Copy hay đến mấy mà hardcode trong component thì vẫn là lỗi.

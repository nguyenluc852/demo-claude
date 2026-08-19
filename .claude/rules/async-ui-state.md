---
name: async-ui-state
description: Mọi control có gửi request đều phải thể hiện trạng thái đang chạy — chống double-click là bắt buộc.
applies-to: frontend/src/components/**, frontend/src/pages/**, frontend/src/store/slices/**
---

# Chống double-click

Mọi control có gửi request đều truyền trạng thái đang chạy của nó vào `<Button loading>`,
nút sẽ bị vô hiệu hóa và đổi sang nhãn đang tải. Một control submit mới mà thiếu phần
nối này là lỗi.

Slice theo dõi trạng thái đó ở đúng mức chi tiết:

- một cờ `submitting` duy nhất khi cả modal bị khóa như một khối;
- một danh sách id (`pendingIds`, `savingRoomIds`) khi từng dòng submit độc lập — một
  thao tác trên một dòng không được làm khóa cả lưới.

Modal nhận thêm prop `busy`, prop này phủ một lớp overlay lên hộp thoại.

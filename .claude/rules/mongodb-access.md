---
name: mongodb-access
description: Cách service truy cập collection MongoDB, và vì sao không được cache handle lúc import.
applies-to: backend/app/db/**, backend/app/services/**
---

# Truy cập MongoDB

`app/db/mongo.py` giữ một client Motor duy nhất. Lifespan của FastAPI gọi `connect()`
(hàm này đồng thời tạo mọi index mà các truy vấn dựa vào) và `close()`.

- Service lấy collection qua `get_collection(Collection.X)` **tại thời điểm gọi** —
  không bao giờ cache handle của collection lúc import, vì nó sẽ cũ đi sau một lần
  kết nối lại.
- Tên collection nằm trong `Collection`, tên field của document nằm trong `Field`.
  Truy vấn dùng các hằng đó, không dùng chuỗi viết thẳng.
- Truy vấn nào cần index mới thì bổ sung index đó vào `connect()` trong cùng thay đổi.

Mongo phải chạy trước thì API mới khởi động được: `docker compose up -d mongo`.

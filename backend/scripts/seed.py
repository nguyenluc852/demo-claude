"""Populate the database with a small but realistic property.

Idempotent: rooms, contracts, and readings are keyed on their natural keys, so
re-running tops the data up instead of duplicating it.

    backend/.venv/bin/python -m scripts.seed
"""

import asyncio
from datetime import UTC, datetime, timedelta

from bson import ObjectId

from app.common.periods import current_period, shift_period
from app.core.constants import (
    Collection,
    Field,
    PaymentCycle,
    RoomStatus,
    RoomType,
    ServiceCode,
    UserRole,
)
from app.db import mongo
from app.schemas.contract import ContractCreate
from app.schemas.lead import LeadCreate
from app.schemas.meter import MeterReadingSave
from app.schemas.room import RoomCreate
from app.schemas.user import UserCreate
from app.services.contract import contract_service
from app.services.lead import lead_service
from app.services.meter import meter_service
from app.services.room import room_service
from app.services.service_setting import service_setting_service
from app.services.user import user_service

ADMIN = UserCreate(username="admin", email="admin@ancu.example.com", password="admin123")

IMAGES = {
    RoomType.STUDIO: [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
    ],
    RoomType.ONE_BEDROOM: [
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200",
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200",
    ],
    RoomType.TWO_BEDROOM: [
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200",
        "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=1200",
    ],
}

AMENITIES = ["Điều hòa", "Nóng lạnh", "Tủ lạnh", "Giường + tủ", "Ban công", "Bếp từ"]

ROOMS = [
    ("101", 1, RoomType.STUDIO, 22.0, 3_200_000),
    ("102", 1, RoomType.STUDIO, 24.0, 3_400_000),
    ("103", 1, RoomType.ONE_BEDROOM, 32.0, 4_500_000),
    ("201", 2, RoomType.STUDIO, 22.0, 3_300_000),
    ("202", 2, RoomType.ONE_BEDROOM, 34.0, 4_700_000),
    ("203", 2, RoomType.TWO_BEDROOM, 46.0, 6_500_000),
    ("301", 3, RoomType.ONE_BEDROOM, 33.0, 4_600_000),
    ("302", 3, RoomType.TWO_BEDROOM, 48.0, 6_800_000),
]

# Room number -> tenant. The rooms left out stay available on the homepage.
TENANTS = [
    ("101", "Nguyễn Văn An", "001199012345", "0912000101", "an.nguyen@example.com", 2),
    ("103", "Trần Thị Bình", "001299023456", "0912000103", "binh.tran@example.com", 1),
    ("202", "Lê Hoàng Cường", "001199034567", "0912000202", "cuong.le@example.com", 3),
    ("203", "Phạm Thu Dung", "001299045678", "0912000203", "dung.pham@example.com", 2),
    ("301", "Vũ Minh Đức", "001199056789", "0912000301", "duc.vu@example.com", 1),
]

# Three billed periods per occupied room, so the revenue chart has a shape.
CONSUMPTION = {
    "101": (95, 7),
    "103": (140, 11),
    "202": (180, 14),
    "203": (210, 18),
    "301": (120, 9),
}

LEADS = [
    LeadCreate(
        name="Hoàng Thị Mai",
        phone="0987000111",
        email="mai.hoang@example.com",
        message="Em muốn xem phòng studio tầng 2, dọn vào đầu tháng sau ạ.",
    ),
    LeadCreate(
        name="Đặng Quốc Huy",
        phone="0987000222",
        email="huy.dang@example.com",
        message="Cho hỏi phòng 2 phòng ngủ còn trống không?",
    ),
]

MAINTENANCE_ROOM = "302"


async def seed() -> None:
    await mongo.connect()
    await service_setting_service.ensure_defaults()

    # Both email and username are unique-indexed, so a re-run (or a database
    # that already has an operator) must not try to insert a second one.
    users = mongo.get_collection(Collection.USERS)
    taken = await users.find_one(
        {"$or": [{Field.EMAIL: ADMIN.email}, {Field.USERNAME: ADMIN.username}]}
    )
    if taken is None:
        await user_service.create_staff(ADMIN, role=UserRole.ADMIN)
        print(f"admin created: {ADMIN.email} / {ADMIN.password}")
    else:
        print(f"admin already present: {taken[Field.EMAIL]}")

    rooms: dict[str, str] = {}
    for number, floor, room_type, area, price in ROOMS:
        existing = await mongo.get_collection(Collection.ROOMS).find_one(
            {Field.ROOM_NUMBER: number}
        )
        if existing is not None:
            rooms[number] = str(existing[Field.ID])
            continue
        room = await room_service.create(
            RoomCreate(
                room_number=number,
                floor=floor,
                room_type=room_type,
                area=area,
                base_price=price,
                amenities=AMENITIES[: 4 if room_type == RoomType.STUDIO else 6],
                images=IMAGES[room_type],
                description=(
                    f"Phòng {number} tầng {floor}, {area}m², "
                    "cửa sổ thoáng, gần thang thoát hiểm."
                ),
                status=RoomStatus.AVAILABLE,
            )
        )
        rooms[number] = room.id
        print(f"room created: {number}")

    start = datetime.now(UTC) - timedelta(days=120)
    for number, name, id_card, phone, email, occupants in TENANTS:
        room_id = rooms[number]
        if await contract_service.active_for_room(room_id) is not None:
            continue
        await contract_service.create(
            ContractCreate(
                room_id=room_id,
                tenant_name=name,
                tenant_id_card=id_card,
                tenant_phone=phone,
                tenant_email=email,
                start_date=start,
                end_date=start + timedelta(days=365),
                deposit=next(price for n, _, _, _, price in ROOMS if n == number),
                payment_cycle=PaymentCycle.MONTHLY,
                occupants=occupants,
            )
        )
        print(f"contract signed: {number} -> {name}")

    # Bill the last three periods so the dashboard chart has history.
    periods = [shift_period(current_period(), offset) for offset in (-2, -1, 0)]
    for number, (electric_step, water_step) in CONSUMPTION.items():
        room_id = rooms[number]
        electric = 0.0
        water = 0.0
        for period in periods:
            electric += electric_step
            water += water_step
            await meter_service.save(
                room_id,
                MeterReadingSave(period=period, electric_new=electric, water_new=water),
            )
        print(f"metered {number} for {', '.join(periods)}")

    await room_service.set_status(ObjectId(rooms[MAINTENANCE_ROOM]), RoomStatus.MAINTENANCE)

    # Seeded tenants are marked verified so the tenant portal can be opened
    # without fishing the confirmation link out of the logs.
    await mongo.get_collection(Collection.USERS).update_many(
        {Field.ROLE: UserRole.TENANT},
        {"$set": {"email_verified": True}, "$unset": {Field.VERIFICATION_TOKEN: ""}},
    )

    if await mongo.get_collection(Collection.LEADS).count_documents({}) == 0:
        for lead in LEADS:
            await lead_service.create(lead)
        print(f"{len(LEADS)} leads created")

    await mongo.close()
    print("\nSeed complete.")
    print(f"  Sign in at /login as {ADMIN.email} / {ADMIN.password}")
    print(
        f"  Tenants sign in with their email and their phone number as the password, "
        f"e.g. {TENANTS[0][4]} / {TENANTS[0][3]}"
    )
    print(
        f"  Electricity and water are billed from the {ServiceCode.ELECTRICITY} and "
        f"{ServiceCode.WATER} entries in the price list."
    )


if __name__ == "__main__":
    asyncio.run(seed())

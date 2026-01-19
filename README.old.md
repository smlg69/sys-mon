src/
├── api/
│   ├── client.ts              # Axios клиент с интерцепторами
│   ├── auth.ts               # Авторизация, токены
│   ├── systems/              # API для систем
│   │   ├── access.ts         # СКУД
│   │   ├── cctv.ts          # Видеонаблюдение
│   │   ├── hvac.ts          # ЖКХ
│   │   └── index.ts
│   ├── equipment.ts          # Оборудование
│   ├── requests.ts           # Заявки
│   ├── reports.ts           # Отчеты
│   └── admin.ts             # Администрирование
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Layout.tsx
│   ├── systems/
│   │   ├── AccessSystem.tsx
│   │   ├── CCTVSystem.tsx
│   │   ├── HVACSystem.tsx
│   │   └── Dashboard.tsx
│   ├── equipment/
│   │   ├── EquipmentList.tsx
│   │   ├── AddEquipmentModal.tsx
│   │   └── EquipmentCard.tsx
│   ├── requests/
│   │   ├── RequestList.tsx
│   │   ├── RequestModal.tsx
│   │   └── RequestStatus.tsx
│   ├── admin/
│   │   ├── UserManagement.tsx
│   │   ├── RoleSettings.tsx
│   │   └── SystemSettings.tsx
│   └── common/
│       ├── StatusBadge.tsx
│       ├── LoadingSpinner.tsx
│       ├── Modal.tsx
│       └── DataTable.tsx
├── types/
│   ├── index.ts
│   ├── systems.ts
│   ├── equipment.ts
│   ├── requests.ts
│   └── user.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useSystems.ts
│   └── useEquipment.ts
├── store/
│   ├── authSlice.ts
│   ├── systemsSlice.ts
│   └── index.ts
├── utils/
│   ├── tokenService.ts
│   ├── dateFormatter.ts
│   └── validation.ts
├── pages/
│   ├── DashboardPage.tsx
│   ├── AccessSystemPage.tsx
│   ├── CCTVSystemPage.tsx
│   ├── HVACSystemPage.tsx
│   ├── AdminPage.tsx
│   ├── ReportsPage.tsx
│   └── RequestsPage.tsx
└── App.tsx
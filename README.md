# Library Workspace Manager

A comprehensive desktop application for managing library workspaces, study areas, and services for college students.

## 🚀 Quick Start for Windows Users

To get a ready-to-install Windows package:

1. **Install Node.js** (if not already installed):
   - Download from https://nodejs.org/ (LTS version)
   - Run the installer (accept all defaults)

2. **Get the source code**:
   - Copy all files from this repository to a folder on your Windows machine
   - Or download the source as a ZIP file

3. **Build the installer**:
   - Double-click `build-windows.bat`
   - Wait for the automatic build to complete
   - Find your installer in `dist-electron\Library Workspace Manager Setup x64.exe`

4. **Install and use**:
   - Double-click the .exe file
   - Follow the installation wizard
   - Launch from Start menu

## 📖 Documentation

- [Windows Compatibility Guide](WINDOWS_COMPATIBILITY.md) - Certified for Windows 10 & 11
- [Build Instructions](BUILD_INSTRUCTIONS.md) - Detailed technical build process
- [Final Delivery Summary](FINAL_DELIVERY.md) - Complete feature overview
- [Ready for Windows Build](READY_FOR_WINDOWS_BUILD.md) - Pre-build checklist

## 🎯 Features

- Time-based billing for study areas (general/AC/private rooms)
- Weekly/bi-weekly/monthly subscriptions with auto-expiry
- Inventory management for coffee/tea/snacks
- Customer notes and debt tracking
- Bilingual Arabic/English interface (RTL support)
- One-click database backup and restore
- Full reporting and analytics
- Modern UI optimized for front-desk use

## 🖥️ System Requirements

- **OS**: Windows 10 version 1809+ or Windows 11 21H2+
- **Memory**: 2 GB RAM (4 GB recommended)
- **Storage**: 500 MB available space
- **Display**: 1024x768 minimum resolution

## 💡 Support

The application stores all data locally in `%APPDATA%\Library Workspace Manager\` and functions 100% offline after installation. For enterprise deployment, the standard .exe installer works with SCCM/Intune and respects Windows installation best practices.

--- 
*Built with Electron, React, and TypeScript for reliable cross-platform desktop performance.*

## Features

### Core Functionality
- **Customer Management**: Add, edit, and delete customer records
- **Session Tracking**: Check customers in/out with time-based billing
- **Room Management**: Different room types with varying hourly rates (general, AC rooms, private rooms)
- **Subscription System**: Weekly, bi-weekly, and monthly subscriptions with automatic expiry tracking
- **Product Inventory**: Manage kitchen items (coffee, tea, snacks) and track consumption
- **Customer Notes**: Add notes and track customer debts
- **Reports**: View revenue, session statistics, and usage analytics
- **Settings**: Configure application parameters

### Billing System
- Time-based billing: Customers pay per hour based on room type
- Consumables billing: Add cost of drinks/snacks consumed during session
- Subscription-aware pricing: Subscribers may get free or discounted time (configurable)
- Tax calculation: Automatic tax application based on settings

### Room Types
- **General Area**: Standard study space (no AC) - Base rate
- **AC Room**: Air-conditioned private room - Premium rate
- **Private Room**: Regular private room - Standard rate

### Subscription Plans
- **Weekly**: 7-day access
- **Bi-weekly**: 14-day access  
- **Monthly**: 30-day access
- Automatic expiry notifications on customer check-in

## Technology Stack

- **Framework**: Electron.js with React.js
- **Language**: TypeScript
- **Database**: SQLite (via better-sqlite3)
- **Build Tool**: Vite
- **Packaging**: Electron Builder

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development servers:
   ```bash
   npm run dev
   ```
   This will start both the Electron main process and the Vite dev server.

4. For production build:
   ```bash
   npm run dist
   ```
   This will create Windows installers in the `dist-electron` directory.

## Database Schema

The application uses SQLite with the following tables:
- `customers`: id, name, phone, email, created_at, updated_at
- `sessions`: id, customer_id, check_in_time, check_out_time, duration_minutes, hourly_rate, room_type, total_amount, status
- `subscriptions`: id, customer_id, type, start_date, end_date, price, is_active, created_at
- `products`: id, name, category, price, stock, is_active, created_at
- `session_products`: id, session_id, product_id, quantity, unit_price
- `room_types`: id, name, description, hourly_rate, is_active
- `settings`: id, key, value, updated_at
- `customer_notes`: id, customer_id, note, is_debt, debt_amount, created_at

## Windows Distribution

To create a distributable Windows installer:
1. Ensure you have the prerequisites installed:
   - Node.js (v16+)
   - Windows Build Tools (for native modules)
2. Run:
   ```bash
   npm run dist:win
   ```
3. The installer will be available in `dist-electron\` as:
   - `Library Workspace Manager Setup x64.exe`

## License

MIT License - Feel free to use and modify for your library's needs.

## Support

For issues or feature requests, please create an issue in the repository.
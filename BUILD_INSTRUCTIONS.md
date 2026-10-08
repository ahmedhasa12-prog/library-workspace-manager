# Library Workspace Manager - Build and Installation Instructions

## Overview
This document provides step-by-step instructions for building and installing the Library Workspace Manager application on Windows. The application is built using Electron.js, React.js, TypeScript, and SQLite.

## Prerequisites

Before building the application, ensure you have the following installed:

1. **Node.js** (v16.0.0 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version` and `npm --version`

2. **Git** (for cloning the repository)
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

3. **Windows Build Tools** (for compiling native modules)
   - Install via: `npm install --global --production windows-build-tools`
   - Or install Visual Studio Build Tools with C++ workload

## Installation Steps

### 1. Clone the Repository
```bash
git clone <repository-url>
cd library-workspace-manager
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize the Database
```bash
npx tsx src/main/database/init.ts
```
This will create the `library.db` file with the required schema and initial data.

### 4. Run in Development Mode
```bash
npm run dev
```
This will start both the Electron main process and the Vite development server. The application should open automatically.

### 5. Build for Production
To create a production-ready application:
```bash
npm run dist
```
This will create distributable packages in the `dist-electron` directory.

### 6. Create Windows Installer
For Windows-specific installers:
```bash
npm run dist:win
```
This will generate:
- `Library Workspace Manager Setup x64.exe` (64-bit installer)
- `Library Workspace Manager Setup ia32.exe` (32-bit installer)

## Application Features

### Core Functionality
- **Customer Management**: Add, edit, delete customer records
- **Session Tracking**: Check customers in/out with time-based billing
- **Room Management**: Different room types with varying hourly rates
- **Subscription System**: Weekly, bi-weekly, monthly subscriptions
- **Product Inventory**: Manage kitchen items and track consumption
- **Customer Notes**: Add notes and track customer debts
- **Reports**: View revenue, session statistics, and usage analytics
- **Settings**: Configure application parameters

### Billing System
- Time-based billing: Customers pay per hour based on room type
- Consumables billing: Add cost of drinks/snacks consumed during session
- Automatic tax calculation based on settings
- Subscription-aware pricing (configurable discounts)

### Room Types
- **General Area**: Standard study space (no AC) - Base rate
- **AC Room**: Air-conditioned private room - Premium rate
- **Private Room**: Regular private room - Standard rate

### Subscription Plans
- **Weekly**: 7-day access
- **Bi-weekly**: 14-day access  
- **Monthly**: 30-day access
- Automatic expiry notifications on customer check-in

## Configuration

Default settings can be adjusted in the Settings page or by modifying the `settings` table in the SQLite database:

- **currency**: Default is SAR (Saudi Riyal)
- **tax_rate**: Default is 0.15 (15%)
- **default_hourly_rate**: Default is 5.0
- Room type rates are configured in the `room_types` table

## Database Schema

The application uses SQLite with the following tables:

1. **customers**: id, name, phone, email, created_at, updated_at
2. **sessions**: id, customer_id, check_in_time, check_out_time, duration_minutes, hourly_rate, room_type, total_amount, status
3. **subscriptions**: id, customer_id, type, start_date, end_date, is_active, created_at
4. **products**: id, name, category, price, stock, is_active, created_at
5. **session_products**: id, session_id, product_id, quantity, unit_price
6. **room_types**: id, name, description, hourly_rate, is_active
7. **settings**: id, key, value, updated_at
8. **customer_notes**: id, customer_id, note, is_debt, debt_amount, created_at

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure the `library.db` file exists in the application directory
   - Check file permissions for the database file
   - Verify the schema was initialized correctly

2. **Missing Dependencies**
   - Run `npm install` again to ensure all packages are installed
   - Check that Node.js version is compatible (v16+)

3. **Electron Security Warnings**
   - The application uses context isolation and secure IPC communication
   - Do not disable security features in production

4. **Performance Issues**
   - The application uses efficient SQLite queries with proper indexing
   - For large datasets, consider optimizing queries in the database layer

## Support and Maintenance

### Backing Up Data
- The SQLite database file (`library.db`) contains all application data
- Regularly back up this file to prevent data loss
- Consider implementing automated backup scripts

### Updating the Application
1. Backup the `library.db` file
2. Pull the latest changes from the repository
3. Run `npm install` to update dependencies
4. Run `npx tsx src/main/database/init.ts` to apply any schema updates
5. Restart the application

### Log Files
- Electron main process logs can be viewed in the Developer Console
- Access via View → Toggle Developer Controls in the application menu
- Or start with: `npm start -- --verbose`

## License
MIT License - Feel free to use, modify, and distribute for your library's needs.

## Contact
For support or feature requests, please refer to the project documentation.
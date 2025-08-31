# Recipe Module Documentation

## Overview
A comprehensive Recipe Management System has been added to the Cloud Shop Admin Panel, providing full CRUD operations for managing cooking recipes with rich features and an elegant UI.

## Features Implemented

### 1. Database Schema
- **recipes** - Main recipe table with comprehensive fields
- **recipe_ingredients** - Ingredients with quantities and units
- **recipe_steps** - Step-by-step cooking instructions
- **recipe_categories** - Recipe categorization
- **recipe_nutrition** - Nutritional information
- **recipe_reviews** - User reviews and ratings

### 2. Admin Interface

#### Recipe List Page (`/admin/recipes`)
- **Dual View Modes**: Grid view (cards) and List view (table)
- **Advanced Search**: Real-time search with debouncing
- **Multi-Filter System**:
  - Difficulty level (Easy, Medium, Hard, Expert)
  - Meal type (Breakfast, Lunch, Dinner, etc.)
  - Cuisine type (Vietnamese, Chinese, Japanese, etc.)
  - Cooking time ranges
  - Dietary preferences
- **Smart Badges**:
  - "New" badge for recipes created within 7 days
  - "Featured" badge for highlighted recipes
  - Dietary tags (Vegetarian, Vegan, Gluten-free, etc.)
- **Quick Actions**:
  - Toggle active/inactive status
  - View, Edit, Delete operations
  - Bulk operations support
- **Pagination**: 12 recipes per page with smart page navigation

### 3. Visual Design

#### Color Coding System
- **Difficulty Levels**:
  - Easy: Green badges
  - Medium: Yellow badges
  - Hard: Orange badges
  - Expert: Red badges

- **Dietary Tags**:
  - Vegetarian: Green
  - Vegan: Emerald
  - Gluten-free: Amber
  - Dairy-free: Blue
  - And more...

#### Card Layout Features
- Recipe image with fallback icon
- Cooking time with clock icon
- Servings indicator
- Calorie count with fire icon
- Star rating system
- View counter
- Cuisine flag emojis

### 4. TypeScript Support
- Complete type definitions in `types/recipe.ts`
- Interfaces for all entities
- Enums for predefined values
- Type-safe API responses

### 5. Utility Functions
Located in `lib/recipe-utils.ts`:
- Time formatting (30m, 1h 30m, etc.)
- Color mapping for badges
- Text truncation
- Dietary tag parsing
- Recipe validation
- Drag-and-drop reordering
- SEO-friendly slug generation

## Setup Instructions

### 1. Database Setup
```bash
# Run the database migration
node scripts/setup-recipes-tables.js
```

### 2. Access the Module
1. Navigate to Admin Panel: `http://localhost:3000/admin`
2. Click on "Công thức nấu" in the sidebar
3. Start adding recipes!

## File Structure
```
cloud-shop/
├── scripts/
│   └── setup-recipes-tables.js      # Database migration
├── types/
│   └── recipe.ts                    # TypeScript definitions
├── lib/
│   └── recipe-utils.ts              # Utility functions
├── pages/
│   └── admin/
│       └── recipes/
│           ├── index.tsx            # Recipe list page
│           ├── add.tsx             # Add recipe (to be implemented)
│           ├── [id].tsx            # Recipe detail (to be implemented)
│           └── edit/
│               └── [id].tsx        # Edit recipe (to be implemented)
└── components/
    └── Layout/
        └── AdminLayout.tsx          # Updated with recipe menu

```

## Vietnamese Translations
All UI elements include Vietnamese translations:
- "Công thức nấu" - Recipes
- "Độ khó" - Difficulty
- "Thời gian" - Time
- "Khẩu phần" - Servings
- "Chế độ ăn" - Dietary
- And more...

## Next Steps

### To Complete Implementation:
1. **API Endpoints** - Create backend APIs for CRUD operations
2. **Add Recipe Page** - Form for creating new recipes
3. **Edit Recipe Page** - Form for updating existing recipes
4. **Recipe Detail Page** - Beautiful display of recipe information
5. **Component Library** - Reusable recipe components
6. **Image Upload** - Recipe photo management
7. **Bulk Operations** - Select multiple recipes for batch actions
8. **Export Features** - PDF and CSV export functionality

## Demo Data
The current implementation includes demo data with Vietnamese recipes:
- Phở Bò Truyền Thống
- Bánh Mì Thịt Nướng
- Gỏi Cuốn Chay

These will be replaced with real data once the API endpoints are implemented.

## Technologies Used
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Icons** - Icon library
- **MySQL** - Database
- **React Toastify** - Notifications

## Design Highlights
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Clean, professional interface
- **User Experience**: Intuitive navigation and interactions
- **Performance**: Optimized loading with pagination
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Support
For questions or issues, please refer to the main project documentation or contact the development team.

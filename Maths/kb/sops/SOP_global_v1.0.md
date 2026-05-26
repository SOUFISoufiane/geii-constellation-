# SOP_global_v1.0

## 1. Objective
To outline the standard operating procedure for maintaining the global structure, shared components, and deployment of the GEII Visual Toolbox website.

## 2. Scope
Applies to all root-level configurations, the shared galaxy navigation system (`home-galaxy.js`), and global styles (`theme.css`).

## 3. Prerequisites
- Access to the `Maths` repository.
- Local development environment with a Python server (`dev_server.py`).
- Familiarity with the app component structure.

## 4. Procedure
1. **Starting the Dev Server**: Run `python dev_server.py` in the `Maths` root directory.
2. **Adding a New App**: 
   - Create a new directory under `Maths/apps/`.
   - Update `home-galaxy.js` to mount the new app.
3. **Updating Global Theme**:
   - Edit variables in `shared/css/theme.css`.
   - Ensure cache busting is active for testing.

## 5. Troubleshooting
- **Assets Not Loading**: Verify relative paths and cache-busting parameters (`?v=timestamp`).

## 6. Revision History
- **v1.0**: Initial Creation.

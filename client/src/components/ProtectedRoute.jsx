// // src/components/ProtectedRoute.jsx
// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute({ user, requiredRoles = [] }) {
  // 1. If not logged in -> redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If no specific roles required, allow access
  if (requiredRoles.length === 0) {
    return <Outlet />;
  }

  // 2. Normalize user role string / ID
  const userRole = (user.role || user.role_name || user.role_id || '').toString();

  const hasPermission = requiredRoles.some(
    (role) => role.toString().toLowerCase() === userRole.toLowerCase()
  );

  // 3. If unauthorized -> redirect to default page
  if (!hasPermission) {
    return <Navigate to="/master-list" replace />;
  }

  // 4. Render child route components
  return <Outlet />;
}


// import { Navigate, Outlet } from 'react-router-dom';

// export default function ProtectedRoute({ user, requiredRoles = [] }) {
//   // 1. Not logged in -> redirect to login page
//   if (!user) {
//     return <Navigate to="/login" replace />;
//   }

//   // Check role flexibility (string role, role name, or numeric ID)
//   const userRole = (user.role || user.role_name || user.role_id || '').toString();

//   const hasPermission = requiredRoles.some(
//     (role) => role.toString().toLowerCase() === userRole.toLowerCase()
//   );

//   if (!hasPermission) {
//     // If not authorized, redirect to default authorized route or page
//     return <Navigate to="/task" replace />;
//   }

//   // REQUIRED: Must return <Outlet /> for child routes to render inside the layout!
//   return <Outlet />;

//   // // Normalize role string and ID
//   // const roleStr = String(user.role || '').toLowerCase();
//   // const roleId = String(user.role_id || '');

//   // const isAdmin = roleStr === 'admin' || roleId === '1';
//   // const isFieldManager = roleStr === 'field manager' || roleId === '2';

//   // // 2. Admins get full access to every route
//   // if (isAdmin) {
//   //   return <Outlet />;
//   // }

//   // 3. Check role-specific access if specific roles are required on the route
//   if (requiredRoles.length > 0) {
//     const normalizedRequired = requiredRoles.map((r) => String(r).toLowerCase());

//     const hasAccess =
//       (isFieldManager && (normalizedRequired.includes('field manager') || normalizedRequired.includes('2'))) ||
//       normalizedRequired.includes(roleStr) ||
//       normalizedRequired.includes(roleId);

//     if (!hasAccess) {
//       // Fallback for unauthorized logged-in users (prevents redirecting to /login)
//       const defaultFallback = isFieldManager ? '/master-list' : '/dashboard';
//       return <Navigate to={defaultFallback} replace />;
//     }
//   }

//   return <Outlet />;
// }
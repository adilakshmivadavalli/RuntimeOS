// Test IDs for the auth feature.
//
// The product no longer has a login/register/logout UI (see
// frontend/src/lib/auth.jsx) — every request is transparently authenticated
// as a shared demo user, so there's nothing here to locate in end-to-end
// tests anymore. Kept as an empty module, not deleted, so the re-export in
// ./index.js and any external import of this path don't need to change if
// a real auth UI ever comes back.

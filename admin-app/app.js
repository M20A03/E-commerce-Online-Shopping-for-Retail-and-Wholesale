import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js';
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where
} from 'https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCSqLi9Iu3CeYOfNH7yPCX32LTyXUR-MBQ',
  authDomain: 'react4-eb851.firebaseapp.com',
  projectId: 'react4-eb851',
  storageBucket: 'react4-eb851.firebasestorage.app',
  messagingSenderId: '438069281435',
  appId: '1:438069281435:web:cfd2d4e5ae3c1706d0fc3e',
  measurementId: 'G-G6VQK5EBKX'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const authPanel = document.getElementById('authPanel');
const appPanel = document.getElementById('appPanel');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const createForm = document.getElementById('createForm');
const list = document.getElementById('list');
const errorText = document.getElementById('errorText');
const statusText = document.getElementById('statusText');
const refreshBtn = document.getElementById('refreshBtn');
const rolePanel = document.getElementById('rolePanel');
const roleForm = document.getElementById('roleForm');
const roleEmailInput = document.getElementById('roleEmailInput');
const revokeBtn = document.getElementById('revokeBtn');
const roleStatusText = document.getElementById('roleStatusText');

let currentUserIsSuperAdmin = false;

const clearError = () => {
  errorText.textContent = '';
};

const setError = (message) => {
  errorText.textContent = message || 'Something went wrong.';
};

const getIsAdmin = async (uid) => {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    return false;
  }
  return snap.data().isAdmin === true;
};

const getIsSuperAdmin = async (uid) => {
  const markerRef = doc(db, 'superAdmins', uid);
  const snap = await getDoc(markerRef);
  return snap.exists();
};

const setRoleStatus = (message = '') => {
  roleStatusText.textContent = message;
};

const setAdminRoleByEmail = async (email, isAdminValue) => {
  const trimmed = email.trim().toLowerCase();
  const userQuery = query(collection(db, 'users'), where('email', '==', trimmed));
  const snapshot = await getDocs(userQuery);

  if (snapshot.empty) {
    throw new Error('User not found for this email.');
  }

  const targetDoc = snapshot.docs[0];
  await updateDoc(doc(db, 'users', targetDoc.id), {
    isAdmin: isAdminValue,
    updatedAt: new Date().toISOString()
  });
};

const showCustomerMode = () => {
  authPanel.classList.remove('hidden');
  appPanel.classList.add('hidden');
  rolePanel.classList.add('hidden');
  roleForm.reset();
  setRoleStatus('');
  logoutBtn.classList.add('hidden');
};

const showAdminMode = () => {
  authPanel.classList.add('hidden');
  appPanel.classList.remove('hidden');
  if (currentUserIsSuperAdmin) {
    rolePanel.classList.remove('hidden');
  } else {
    rolePanel.classList.add('hidden');
  }
  logoutBtn.classList.remove('hidden');
};

const renderProducts = async () => {
  statusText.textContent = 'Loading products...';
  list.innerHTML = '';

  const productQuery = query(collection(db, 'products'), orderBy('name'));
  const snapshot = await getDocs(productQuery);

  if (snapshot.empty) {
    statusText.textContent = 'No products in database.';
    return;
  }

  statusText.textContent = `${snapshot.size} products found`;

  snapshot.docs.forEach((row) => {
    const product = row.data();
    const item = document.createElement('div');
    item.className = 'item';

    const left = document.createElement('div');
    const title = document.createElement('p');
    title.innerHTML = `<strong>${product.name || 'Unnamed'}</strong>`;

    const meta = document.createElement('p');
    const price = Number(product.price || 0).toFixed(2);
    meta.innerHTML = `Category: ${product.category || 'others'} | Price: Rs ${price} <span class="badge">${product.isActive === false ? 'Hidden' : 'Visible'}</span>`;

    left.appendChild(title);
    left.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'item-actions';

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'btn btn-soft';
    toggleBtn.textContent = product.isActive === false ? 'Show' : 'Hide';
    toggleBtn.onclick = async () => {
      clearError();
      try {
        await updateDoc(doc(db, 'products', row.id), {
          isActive: !(product.isActive !== false),
          updatedAt: new Date().toISOString()
        });
        await renderProducts();
      } catch (err) {
        setError(err.message);
      }
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = async () => {
      clearError();
      const ok = window.confirm('Delete this product?');
      if (!ok) return;
      try {
        await deleteDoc(doc(db, 'products', row.id));
        await renderProducts();
      } catch (err) {
        setError(err.message);
      }
    };

    actions.appendChild(toggleBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(left);
    item.appendChild(actions);
    list.appendChild(item);
  });
};

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError();

  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    setError(err.message);
  }
});

logoutBtn.addEventListener('click', async () => {
  clearError();
  try {
    await signOut(auth);
  } catch (err) {
    setError(err.message);
  }
});

createForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError();

  const name = document.getElementById('nameInput').value.trim();
  const price = Number(document.getElementById('priceInput').value);
  const category = document.getElementById('categoryInput').value;
  const image = document.getElementById('imageInput').value.trim();
  const description = document.getElementById('descriptionInput').value.trim();
  const featured = document.getElementById('featuredInput').checked;
  const isActive = document.getElementById('activeInput').checked;

  if (!name || !image || !description || Number.isNaN(price)) {
    setError('Please fill all product fields correctly.');
    return;
  }

  try {
    await addDoc(collection(db, 'products'), {
      name,
      price,
      category,
      image,
      description,
      featured,
      isActive,
      stock: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    createForm.reset();
    document.getElementById('activeInput').checked = true;
    await renderProducts();
  } catch (err) {
    setError(err.message);
  }
});

refreshBtn.addEventListener('click', async () => {
  clearError();
  try {
    await renderProducts();
  } catch (err) {
    setError(err.message);
  }
});

roleForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError();

  if (!currentUserIsSuperAdmin) {
    setError('Only super-admin can grant roles.');
    return;
  }

  try {
    await setAdminRoleByEmail(roleEmailInput.value, true);
    setRoleStatus('Admin role granted successfully.');
  } catch (err) {
    setError(err.message);
  }
});

revokeBtn.addEventListener('click', async () => {
  clearError();

  if (!currentUserIsSuperAdmin) {
    setError('Only super-admin can revoke roles.');
    return;
  }

  try {
    await setAdminRoleByEmail(roleEmailInput.value, false);
    setRoleStatus('Admin role revoked successfully.');
  } catch (err) {
    setError(err.message);
  }
});

onAuthStateChanged(auth, async (currentUser) => {
  clearError();

  if (!currentUser) {
    showCustomerMode();
    return;
  }

  try {
    const admin = await getIsAdmin(currentUser.uid);
    if (!admin) {
      await signOut(auth);
      setError('This account is not admin. Ask for admin role first.');
      showCustomerMode();
      return;
    }

    currentUserIsSuperAdmin = await getIsSuperAdmin(currentUser.uid);
    setRoleStatus(currentUserIsSuperAdmin ? 'Super-admin mode enabled.' : '');

    showAdminMode();
    await renderProducts();
    await renderOrdersManagement();
  } catch (err) {
    setError(err.message);
    showCustomerMode();
  }
});

// ============================================================
// ORDERS & DISPATCH MANAGEMENT SECTION
// ============================================================

export const renderOrdersManagement = async (statusFilter = 'all') => {
  let ordersContainer = document.getElementById('ordersManagementPanel');
  if (!ordersContainer) {
    ordersContainer = document.createElement('section');
    ordersContainer.id = 'ordersManagementPanel';
    ordersContainer.className = 'card';
    ordersContainer.style.marginTop = '2rem';
    appPanel.appendChild(ordersContainer);
  }

  ordersContainer.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1rem; border-bottom:1px solid #e2e8f0; padding-bottom:0.75rem;">
      <h2 style="margin:0;">Live Orders & Dispatch Management</h2>
      <div style="display:flex; gap:0.5rem; align-items:center;">
        <select id="adminOrderStatusFilter" class="status-select" style="padding:0.4rem 0.8rem; border-radius:6px; border:1px solid #cbd5e1;">
          <option value="all" ${statusFilter === 'all' ? 'selected' : ''}>All Orders</option>
          <option value="pending_verification" ${statusFilter === 'pending_verification' ? 'selected' : ''}>Pending Verification</option>
          <option value="CONFIRMED" ${statusFilter === 'CONFIRMED' ? 'selected' : ''}>Confirmed</option>
          <option value="PACKED" ${statusFilter === 'PACKED' ? 'selected' : ''}>Packed</option>
          <option value="DISPATCHED" ${statusFilter === 'DISPATCHED' ? 'selected' : ''}>Dispatched</option>
          <option value="OUT_FOR_DELIVERY" ${statusFilter === 'OUT_FOR_DELIVERY' ? 'selected' : ''}>Out for Delivery</option>
          <option value="DELIVERED" ${statusFilter === 'DELIVERED' ? 'selected' : ''}>Delivered</option>
        </select>
        <button id="refreshOrdersBtn" class="btn btn-soft" style="padding:0.4rem 0.8rem;">Refresh Orders</button>
      </div>
    </div>
    <div id="ordersListWrap" style="display:flex; flex-direction:column; gap:1rem;">
      <p style="color:#64748b;">Loading orders...</p>
    </div>
  `;

  document.getElementById('adminOrderStatusFilter')?.addEventListener('change', (e) => {
    renderOrdersManagement(e.target.value);
  });
  document.getElementById('refreshOrdersBtn')?.addEventListener('click', () => {
    const sel = document.getElementById('adminOrderStatusFilter');
    renderOrdersManagement(sel ? sel.value : 'all');
  });

  const ordersListWrap = document.getElementById('ordersListWrap');

  try {
    const ordersQuery = query(collection(db, 'orders'), orderBy('date', 'desc'));
    const snapshot = await getDocs(ordersQuery);

    if (snapshot.empty) {
      ordersListWrap.innerHTML = '<p style="color:#64748b;">No orders in database.</p>';
      return;
    }

    const filteredDocs = snapshot.docs.filter((d) => {
      const data = d.data();
      const st = (data.status || '').toUpperCase().replace(/[\s-]+/g, '_');
      if (statusFilter === 'pending_verification') {
        const isRev = (data.paymentVerificationStatus || '').toLowerCase().includes('review');
        return isRev || st === 'ORDER_PLACED';
      }
      if (statusFilter !== 'all') {
        return st === statusFilter;
      }
      return true;
    });

    if (filteredDocs.length === 0) {
      ordersListWrap.innerHTML = '<p style="color:#64748b;">No orders match this filter.</p>';
      return;
    }

    ordersListWrap.innerHTML = '';

    filteredDocs.forEach((docItem) => {
      const order = docItem.data();
      const docId = docItem.id;
      const orderRefId = order.id || docId;
      const isUPI = (order.paymentMethod || '').toLowerCase() === 'upi';
      const utr = order.paymentData?.utr || order.paymentData?.transactionId || '';
      const verStatus = order.paymentVerificationStatus || (isUPI ? 'Under Review' : 'COD Confirmed');
      const normStatus = (order.status || 'ORDER_PLACED').toUpperCase().replace(/[\s-]+/g, '_');

      const card = document.createElement('div');
      card.style.cssText = 'background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:1.25rem;';

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
          <div>
            <strong style="font-size:1.05rem;">Order #${orderRefId}</strong>
            <span style="margin-left:0.5rem; font-size:0.75rem; padding:2px 8px; border-radius:999px; background:#e0f2fe; color:#0369a1; font-weight:700;">${normStatus}</span>
            <p style="margin:4px 0 0; font-size:0.85rem; color:#475569;">
              Customer: <strong>${order.customer?.firstName || ''} ${order.customer?.lastName || ''}</strong> (${order.customer?.contact || 'N/A'})
            </p>
            <p style="margin:2px 0 0; font-size:0.82rem; color:#64748b;">
              Ship to: ${order.customer?.shippingAddress || 'N/A'}
            </p>
          </div>
          <div style="text-align:right;">
            <div style="font-size:1.15rem; font-weight:800; color:#b45309;">₹${Number(order.total || 0).toFixed(2)}</div>
            <span style="font-size:0.8rem; color:#64748b;">${order.paymentMethod?.toUpperCase()}</span>
          </div>
        </div>

        <!-- Payment verification -->
        <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:6px; padding:0.6rem 0.85rem; margin-bottom:0.75rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
          <div style="font-size:0.85rem;">
            <span>Payment: <strong>${isUPI ? 'Direct UPI' : 'Cash on Delivery'}</strong></span>
            ${isUPI && utr ? `<span style="margin-left:0.75rem; background:#f1f5f9; padding:2px 6px; border-radius:4px;">UTR: <strong>${utr}</strong></span>` : ''}
            <span style="margin-left:0.75rem; font-size:0.75rem; font-weight:700; color:${verStatus.includes('Verified') ? '#16a34a' : '#ea580c'};">
              (${verStatus})
            </span>
          </div>
          ${isUPI ? `
            <div style="display:flex; gap:0.4rem;">
              <button class="btn verify-upi-btn" style="padding:3px 8px; font-size:0.75rem; background:#22c55e; color:#fff; border-radius:4px;">Verify UPI</button>
              <button class="btn reject-upi-btn" style="padding:3px 8px; font-size:0.75rem; background:#ef4444; color:#fff; border-radius:4px;">Reject UPI</button>
            </div>
          ` : ''}
        </div>

        <!-- Dispatch Information -->
        <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:6px; padding:0.6rem 0.85rem; margin-bottom:0.75rem; font-size:0.85rem;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong>Dispatch Info:</strong>
            <button class="btn edit-dispatch-btn" style="background:none; border:none; color:#0284c7; cursor:pointer; font-size:0.78rem; text-decoration:underline;">Edit Courier / Rider</button>
          </div>
          <p style="margin:4px 0 0; color:#475569;">
            Courier: <strong>${order.dispatchInfo?.courierName || 'Roshan Express Local'}</strong> | 
            Rider: <strong>${order.dispatchInfo?.riderName || 'Roshan Delivery Associate'}</strong> (${order.dispatchInfo?.riderContact || '+91 7004634675'})
          </p>
        </div>

        <!-- Status transition buttons -->
        <div style="display:flex; gap:0.4rem; flex-wrap:wrap; align-items:center; border-top:1px solid #e2e8f0; padding-top:0.75rem;">
          <span style="font-size:0.8rem; font-weight:600; color:#64748b;">Transitions:</span>
          <button class="btn confirm-btn" style="padding:3px 8px; font-size:0.75rem; background:#e2e8f0; border-radius:4px;">Confirm</button>
          <button class="btn pack-btn" style="padding:3px 8px; font-size:0.75rem; background:#f3e8ff; color:#7e22ce; border-radius:4px;">Mark Packed</button>
          <button class="btn dispatch-btn" style="padding:3px 8px; font-size:0.75rem; background:#e0f2fe; color:#0369a1; border-radius:4px;">Mark Dispatched</button>
          <button class="btn out-btn" style="padding:3px 8px; font-size:0.75rem; background:#ffedd5; color:#c2410c; border-radius:4px;">Out for Delivery</button>
          <button class="btn deliver-btn" style="padding:3px 8px; font-size:0.75rem; background:#dcfce7; color:#15803d; border-radius:4px;">Mark Delivered</button>
        </div>
      `;

      // Wire button events
      if (isUPI) {
        card.querySelector('.verify-upi-btn')?.addEventListener('click', async () => {
          await updateOrderStatusInApp(docId, order, {
            status: 'CONFIRMED',
            label: 'Payment Confirmed',
            paymentVerificationStatus: 'Payment Verified',
            paymentStatus: 'Paid',
            description: 'UPI UTR verified by administrator.',
            location: 'Roshan Finance Desk, Dhanbad'
          });
          renderOrdersManagement(statusFilter);
        });

        card.querySelector('.reject-upi-btn')?.addEventListener('click', async () => {
          const reason = window.prompt('Reason for rejecting payment:', 'Uncredited UPI reference');
          if (!reason) return;
          await updateOrderStatusInApp(docId, order, {
            status: 'CANCELLED',
            label: 'Payment Rejected',
            paymentVerificationStatus: 'Payment Rejected',
            paymentStatus: 'Failed',
            description: `Payment rejected: ${reason}`,
            location: 'Roshan Finance Desk, Dhanbad'
          });
          renderOrdersManagement(statusFilter);
        });
      }

      card.querySelector('.edit-dispatch-btn')?.addEventListener('click', async () => {
        const courier = window.prompt('Courier Partner Name:', order.dispatchInfo?.courierName || 'Roshan Express Local');
        if (!courier) return;
        const riderName = window.prompt('Delivery Rider Name:', order.dispatchInfo?.riderName || 'Roshan Delivery Associate');
        const riderContact = window.prompt('Rider Phone Number:', order.dispatchInfo?.riderContact || '+91 7004634675');

        await updateOrderStatusInApp(docId, order, {
          dispatchInfo: {
            courierName: courier,
            trackingNumber: order.dispatchInfo?.trackingNumber || orderRefId,
            riderName: riderName || 'Roshan Delivery Associate',
            riderContact: riderContact || '+91 7004634675',
            updatedAt: new Date().toISOString()
          },
          description: `Rider assigned: ${riderName} (${riderContact}) via ${courier}.`
        });
        renderOrdersManagement(statusFilter);
      });

      card.querySelector('.confirm-btn')?.addEventListener('click', async () => {
        await updateOrderStatusInApp(docId, order, { status: 'CONFIRMED', label: 'Payment Confirmed', description: 'Order confirmed by administrator.' });
        renderOrdersManagement(statusFilter);
      });
      card.querySelector('.pack-btn')?.addEventListener('click', async () => {
        await updateOrderStatusInApp(docId, order, { status: 'PACKED', label: 'Packed & Ready', description: 'Items packed and sealed at Dhanbad warehouse.' });
        renderOrdersManagement(statusFilter);
      });
      card.querySelector('.dispatch-btn')?.addEventListener('click', async () => {
        await updateOrderStatusInApp(docId, order, {
          status: 'DISPATCHED',
          label: 'Dispatched',
          description: 'Shipment dispatched with courier partner.',
          dispatchInfo: {
            courierName: order.dispatchInfo?.courierName || 'Roshan Express Local',
            trackingNumber: order.dispatchInfo?.trackingNumber || orderRefId,
            riderName: order.dispatchInfo?.riderName || 'Roshan Delivery Associate',
            riderContact: order.dispatchInfo?.riderContact || '+91 7004634675',
            dispatchDate: new Date().toISOString()
          }
        });
        renderOrdersManagement(statusFilter);
      });
      card.querySelector('.out-btn')?.addEventListener('click', async () => {
        await updateOrderStatusInApp(docId, order, { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', description: 'Package is out with local rider for delivery.' });
        renderOrdersManagement(statusFilter);
      });
      card.querySelector('.deliver-btn')?.addEventListener('click', async () => {
        await updateOrderStatusInApp(docId, order, { status: 'DELIVERED', label: 'Delivered', description: 'Package successfully delivered to customer destination.' });
        renderOrdersManagement(statusFilter);
      });

      ordersListWrap.appendChild(card);
    });
  } catch (err) {
    ordersListWrap.innerHTML = `<p style="color:#ef4444;">Failed to load orders: ${err.message}</p>`;
  }
};

const updateOrderStatusInApp = async (docId, order, patch) => {
  let updatedTimeline = Array.isArray(order?.timeline) ? [...order.timeline] : [];
  if (patch.status) {
    updatedTimeline.push({
      status: patch.status,
      label: patch.label || patch.status,
      timestamp: new Date().toISOString(),
      description: patch.description || `Status updated to ${patch.status}.`,
      location: patch.location || 'Roshan Enterprises Central Desk, Dhanbad'
    });
  }

  const mergedDispatch = patch.dispatchInfo
    ? { ...(order.dispatchInfo || {}), ...patch.dispatchInfo }
    : order.dispatchInfo;

  const payload = {
    updatedAt: new Date().toISOString(),
    ...(patch.status ? { status: patch.status } : {}),
    ...(patch.paymentVerificationStatus ? { paymentVerificationStatus: patch.paymentVerificationStatus } : {}),
    ...(patch.paymentStatus ? { paymentStatus: patch.paymentStatus } : {}),
    ...(mergedDispatch ? { dispatchInfo: mergedDispatch } : {}),
    ...(updatedTimeline.length > 0 ? { timeline: updatedTimeline } : {})
  };

  await updateDoc(doc(db, 'orders', docId), payload);
};

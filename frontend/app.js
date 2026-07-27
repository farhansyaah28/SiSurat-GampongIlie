const apiBase = (window.location.port === '5500' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.'))
  ? `http://${window.location.hostname}:3000/api`
  : `${window.location.origin}/api`;
const serverBase = apiBase.replace(/\/api$/, '');

function el(q) { return document.querySelector(q); }
function els(q) { return Array.from(document.querySelectorAll(q)); }
function showLoader() { const l = el('#globalLoader'); if(l) l.classList.remove('hidden'); if(l) l.style.display='flex'; }
function hideLoader() { const l = el('#globalLoader'); if(l) l.style.display='none'; }
function showToast(msg, ms=3000){
  const t = el('#toast');
  if(!t) return alert(msg);
  el('#toastMsg').textContent = msg;
  t.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(()=> t.classList.add('translate-y-20', 'opacity-0'), ms);
}

// --- UNIVERSAL CUSTOM DIALOG SYSTEM (GLASSMORPHISM POPUP) ---
function ensureCustomDialog() {
  let modal = document.getElementById('customDialogModal');
  if (!modal) {
    const html = `
      <div id="customDialogModal" class="fixed inset-0 z-[100] hidden items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 transition-all duration-300">
        <div id="customDialogCard" class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100 transform scale-95 opacity-0 transition-all duration-300">
          <div class="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
            <div id="customDialogIconBox" class="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-lg flex-shrink-0">
              <i id="customDialogIcon" class="fa-solid fa-circle-exclamation"></i>
            </div>
            <div>
              <h3 id="customDialogTitle" class="font-bold text-lg text-gray-800 leading-tight">Judul Dialog</h3>
              <p id="customDialogSubtitle" class="text-xs text-gray-400">SiSurat Gampong System</p>
            </div>
          </div>
          <div id="customDialogContent" class="text-sm text-gray-600 mb-5 leading-relaxed">
            Pesan dialog di sini.
          </div>
          <div id="customDialogInputBox" class="hidden mb-5">
            <label id="customDialogInputLabel" class="block text-xs font-bold text-gray-700 mb-1.5">Alamat / Catatan Penolakan (Wajib Diisi):</label>
            <textarea id="customDialogTextarea" rows="3" class="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-800 placeholder-gray-400 font-medium" placeholder="Tulis catatan atau alasan di sini..."></textarea>
            <p id="customDialogInputError" class="text-xs text-red-500 font-medium mt-1.5 hidden flex items-center gap-1"><i class="fa-solid fa-circle-exclamation"></i> <span>Harap isi keterangan ini sebelum melanjutkan.</span></p>
          </div>
          <div class="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" id="customDialogBtnCancel" class="px-5 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">Batal</button>
            <button type="button" id="customDialogBtnOk" class="px-6 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"><i class="fa-solid fa-check"></i> <span>Konfirmasi</span></button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    modal = document.getElementById('customDialogModal');
  }
  return modal;
}

window.showCustomDialog = function({ title, subtitle = 'SiSurat Gampong System', message, icon = 'fa-circle-exclamation', iconColor = 'text-red-600', iconBg = 'bg-red-50', btnOkText = 'OK', btnOkClass = 'bg-red-600 hover:bg-red-700 text-white', showCancel = true, showInput = false, inputLabel = '', inputPlaceholder = '', requiredInput = false, onOk = null }) {
  const modal = ensureCustomDialog();
  const card = document.getElementById('customDialogCard');
  const iconEl = document.getElementById('customDialogIcon');
  const iconBox = document.getElementById('customDialogIconBox');
  const titleEl = document.getElementById('customDialogTitle');
  const subtitleEl = document.getElementById('customDialogSubtitle');
  const contentEl = document.getElementById('customDialogContent');
  const inputBox = document.getElementById('customDialogInputBox');
  const inputLabelEl = document.getElementById('customDialogInputLabel');
  const textarea = document.getElementById('customDialogTextarea');
  const inputErr = document.getElementById('customDialogInputError');
  const btnCancel = document.getElementById('customDialogBtnCancel');
  const btnOk = document.getElementById('customDialogBtnOk');

  titleEl.textContent = title;
  subtitleEl.textContent = subtitle;
  contentEl.innerHTML = message;
  iconEl.className = `fa-solid ${icon}`;
  iconBox.className = `w-10 h-10 rounded-2xl ${iconBg} ${iconColor} flex items-center justify-center text-lg flex-shrink-0`;

  if (showInput) {
    inputBox.classList.remove('hidden');
    inputLabelEl.textContent = inputLabel || 'Keterangan / Catatan:';
    textarea.value = '';
    textarea.placeholder = inputPlaceholder || 'Ketik di sini...';
    inputErr.classList.add('hidden');
  } else {
    inputBox.classList.add('hidden');
  }

  btnCancel.style.display = showCancel ? 'inline-flex' : 'none';
  btnOk.className = `px-6 py-2.5 text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 ${btnOkClass}`;
  btnOk.innerHTML = `<i class="fa-solid fa-check"></i> <span>${btnOkText}</span>`;

  const closeDialog = () => {
    card.classList.remove('scale-100', 'opacity-100');
    card.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }, 200);
  };

  btnCancel.onclick = () => {
    closeDialog();
  };

  btnOk.onclick = () => {
    if (showInput && requiredInput && !textarea.value.trim()) {
      inputErr.classList.remove('hidden');
      textarea.focus();
      return;
    }
    const val = showInput ? textarea.value.trim() : true;
    closeDialog();
    if (onOk && typeof onOk === 'function') {
      onOk(val);
    }
  };

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  setTimeout(() => {
    card.classList.remove('scale-95', 'opacity-0');
    card.classList.add('scale-100', 'opacity-100');
    if (showInput) textarea.focus();
  }, 10);
};

window.customAlert = function(title, message, icon = 'fa-circle-info', iconColor = 'text-primary', iconBg = 'bg-primary/10') {
  showCustomDialog({
    title,
    message,
    icon,
    iconColor,
    iconBg,
    btnOkText: 'Mengerti',
    btnOkClass: 'bg-primary hover:bg-[#3f5231] text-white',
    showCancel: false
  });
};

window.customConfirm = function(title, message, onOk, icon = 'fa-triangle-exclamation', iconColor = 'text-amber-600', iconBg = 'bg-amber-50') {
  showCustomDialog({
    title,
    message,
    icon,
    iconColor,
    iconBg,
    btnOkText: 'Ya, Lanjutkan',
    btnOkClass: 'bg-red-600 hover:bg-red-700 text-white',
    showCancel: true,
    onOk
  });
};

function handleJenisSuratChange(selectEl) {
  const container = document.getElementById('dynamicFieldsContainer');
  const body = document.getElementById('dynamicFieldsBody');
  if (!container || !body) return;

  if (!selectEl.value) {
    container.classList.add('hidden');
    body.innerHTML = '';
    return;
  }

  const id = parseInt(selectEl.value, 10);
  const jenis = window.allJenisSurat ? window.allJenisSurat.find(x => x.id_jenis === id) : null;
  const name = selectEl.options[selectEl.selectedIndex].text.toLowerCase();
  let fieldsHtml = '';

  let customFields = [];
  try {
    if (jenis && jenis.custom_fields) {
      customFields = typeof jenis.custom_fields === 'string' ? JSON.parse(jenis.custom_fields) : jenis.custom_fields;
    }
  } catch (e) { console.error(e); }

  if (Array.isArray(customFields) && customFields.length > 0) {
    let rowsHtml = '';
    for (let i = 0; i < customFields.length; i += 2) {
      const f1 = customFields[i];
      const f2 = customFields[i+1];

      let input1 = '';
      if (f1.type === 'date') {
        input1 = `<input type="date" name="${f1.name}" class="input-style !py-2.5 !px-3" required>`;
      } else if (f1.type === 'time') {
        input1 = `<input type="time" name="${f1.name}" class="input-style !py-2.5 !px-3" required>`;
      } else if (f1.type === 'number') {
        input1 = `<input type="number" name="${f1.name}" class="input-style !py-2.5 !px-3" placeholder="Contoh: 12345" required>`;
      } else if (f1.type === 'file') {
        input1 = `<input type="file" name="custom_file_${f1.name}" class="input-style !py-1.5 !px-3 text-xs bg-white" accept="image/*,.pdf,.docx" required>`;
      } else {
        input1 = `<input type="text" name="${f1.name}" class="input-style !py-2.5 !px-3" placeholder="Masukkan ${f1.label}" required>`;
      }

      let input2 = '';
      if (f2) {
        if (f2.type === 'date') {
          input2 = `<input type="date" name="${f2.name}" class="input-style !py-2.5 !px-3" required>`;
        } else if (f2.type === 'time') {
          input2 = `<input type="time" name="${f2.name}" class="input-style !py-2.5 !px-3" required>`;
        } else if (f2.type === 'number') {
          input2 = `<input type="number" name="${f2.name}" class="input-style !py-2.5 !px-3" placeholder="Contoh: 12345" required>`;
        } else if (f2.type === 'file') {
          input2 = `<input type="file" name="custom_file_${f2.name}" class="input-style !py-1.5 !px-3 text-xs bg-white" accept="image/*,.pdf,.docx" required>`;
        } else {
          input2 = `<input type="text" name="${f2.name}" class="input-style !py-2.5 !px-3" placeholder="Masukkan ${f2.label}" required>`;
        }
      }

      rowsHtml += `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 col-span-1 md:col-span-2">
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1">${f1.label}</label>
            ${input1}
          </div>
          ${f2 ? `
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1">${f2.label}</label>
            ${input2}
          </div>
          ` : '<div></div>'}
        </div>
      `;
    }
    fieldsHtml = rowsHtml;
  } else if (name.includes('izin usaha') || name.includes('izin-usaha')) {
    fieldsHtml = `
      <div>
        <label class="block text-xs font-bold text-gray-500 mb-1">Nama Usaha</label>
        <input type="text" name="nama_usaha" class="input-style !py-2.5 !px-3" placeholder="Contoh: Toko Berkah" required>
      </div>
      <div>
        <label class="block text-xs font-bold text-gray-500 mb-1">Alamat Usaha</label>
        <input type="text" name="alamat_usaha" class="input-style !py-2.5 !px-3" placeholder="Contoh: Jln. Tgk Direuleung" required>
      </div>
      <div>
        <label class="block text-xs font-bold text-gray-500 mb-1">Jenis Usaha</label>
        <input type="text" name="jenis_usaha" class="input-style !py-2.5 !px-3" placeholder="Contoh: Dagang Kelontong" required>
      </div>
    `;
  } else if (name.includes('keterangan usaha') || (name.includes('usaha') && !name.includes('izin'))) {
    fieldsHtml = `
      <div>
        <label class="block text-xs font-bold text-gray-500 mb-1">Nama Usaha</label>
        <input type="text" name="nama_usaha" class="input-style !py-2.5 !px-3" placeholder="Contoh: Kilang Padi Berkat" required>
      </div>
      <div>
        <label class="block text-xs font-bold text-gray-500 mb-1">Alamat Usaha</label>
        <input type="text" name="alamat_usaha" class="input-style !py-2.5 !px-3" placeholder="Contoh: Dusun Meunasah Tuha" required>
      </div>
      <div>
        <label class="block text-xs font-bold text-gray-500 mb-1">Jenis Usaha / Bidang</label>
        <input type="text" name="jenis_usaha" class="input-style !py-2.5 !px-3" placeholder="Contoh: Penggilingan Padi" required>
      </div>
    `;
  } else if (name.includes('penghasilan')) {
    fieldsHtml = `
      <div>
        <label class="block text-xs font-bold text-gray-500 mb-1">Jumlah Penghasilan Per Bulan (Rp)</label>
        <input type="number" name="jumlah_penghasilan" class="input-style !py-2.5 !px-3" placeholder="Contoh: 3500000" required>
      </div>
      <div>
        <label class="block text-xs font-bold text-gray-500 mb-1">Instansi / Sumber Penghasilan</label>
        <input type="text" name="sumber_penghasilan" class="input-style !py-2.5 !px-3" placeholder="Contoh: Karyawan Swasta PT. A" required>
      </div>
    `;
  } else if (name.includes('mampu') || name.includes('miskin') || name.includes('sktm')) {
    fieldsHtml = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 col-span-1 md:col-span-2">
        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1">Nama Orang Tua (Ayah/Ibu)</label>
          <input type="text" name="nama_orang_tua" class="input-style !py-2.5 !px-3" placeholder="Contoh: Abdullah" required>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1">Tempat/Tanggal Lahir Orang Tua</label>
          <input type="text" name="ttl_orang_tua" class="input-style !py-2.5 !px-3" placeholder="Contoh: Sigli, 01-01-1965" required>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 col-span-1 md:col-span-2">
        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1">Pekerjaan Orang Tua</label>
          <input type="text" name="pekerjaan_orang_tua" class="input-style !py-2.5 !px-3" placeholder="Contoh: Tani" required>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1">Penghasilan Orang Tua per Bulan (Rp)</label>
          <input type="number" name="penghasilan_orang_tua" class="input-style !py-2.5 !px-3" placeholder="Contoh: 1000000" required>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 col-span-1 md:col-span-2">
        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1">Nama Anak (Wali)</label>
          <input type="text" name="nama_anak" class="input-style !py-2.5 !px-3" placeholder="Contoh: Budi Gunawan" required>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1">Tempat/Tanggal Lahir Anak</label>
          <input type="text" name="ttl_anak" class="input-style !py-2.5 !px-3" placeholder="Contoh: Banda Aceh, 01-01-2000" required>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 col-span-1 md:col-span-2">
        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1">Instansi Sekolah / Universitas</label>
          <input type="text" name="sekolah_anak" class="input-style !py-2.5 !px-3" placeholder="Contoh: Politeknik Aceh" required>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1">Jurusan</label>
          <input type="text" name="jurusan_anak" class="input-style !py-2.5 !px-3" placeholder="Contoh: Informatika" required>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 col-span-1 md:col-span-2">
        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1">NIM / NISN</label>
          <input type="text" name="npm_anak" class="input-style !py-2.5 !px-3" placeholder="Contoh: 2208107010022" required>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1">Jumlah Tanggungan Keluarga (Orang)</label>
          <input type="number" name="jumlah_tanggungan" class="input-style !py-2.5 !px-3" placeholder="Contoh: 4" required>
        </div>
      </div>
    `;
  } else if (name.includes('keluarga') || name.includes('kk')) {
    fieldsHtml = `
      <div>
        <label class="block text-xs font-bold text-gray-500 mb-1">Nomor Kartu Keluarga (KK)</label>
        <input type="text" name="nomor_kk" class="input-style !py-2.5 !px-3" placeholder="16 digit Nomor KK" maxlength="16" required>
      </div>
      <div>
        <label class="block text-xs font-bold text-gray-500 mb-1">Nama Kepala Keluarga</label>
        <input type="text" name="kepala_keluarga" class="input-style !py-2.5 !px-3" placeholder="Contoh: Herman Syah" required>
      </div>
    `;
  } else if (name.includes('tanah')) {
    fieldsHtml = `
      <div>
        <label class="block text-xs font-bold text-gray-500 mb-1">Luas Tanah (m²)</label>
        <input type="number" name="luas_tanah" class="input-style !py-2.5 !px-3" placeholder="Contoh: 300" required>
      </div>
      <div>
        <label class="block text-xs font-bold text-gray-500 mb-1">Dusun / Lokasi Tanah</label>
        <input type="text" name="lokasi_tanah" class="input-style !py-2.5 !px-3" placeholder="Contoh: Dusun Meunasah Tuha" required>
      </div>
      <div>
        <label class="block text-xs font-bold text-gray-500 mb-1">Batas Utara</label>
        <input type="text" name="batas_utara" class="input-style !py-2.5 !px-3" placeholder="Batas sebelah utara" required>
      </div>
      <div>
        <label class="block text-xs font-bold text-gray-500 mb-1">Batas Selatan</label>
        <input type="text" name="batas_selatan" class="input-style !py-2.5 !px-3" placeholder="Batas sebelah selatan" required>
      </div>
    `;
  } else if (name.includes('tidak') && name.includes('pajak')) {
    fieldsHtml = `
      <div>
        <label class="block text-xs font-bold text-gray-500 mb-1">Tahun Pajak / Tahun SPT</label>
        <input type="number" name="tahun_pajak" class="input-style !py-2.5 !px-3" placeholder="Contoh: 2025" required>
      </div>
    `;
  } else if (name.includes('referensi')) {
    fieldsHtml = `
      <div>
        <label class="block text-xs font-bold text-gray-500 mb-1">Instansi / Tujuan Referensi</label>
        <input type="text" name="tujuan_referensi" class="input-style !py-2.5 !px-3" placeholder="Contoh: Dinas Sosial Kota Banda Aceh" required>
      </div>
    `;
  } else if (name.includes('kematian')) {
    fieldsHtml = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 col-span-1 md:col-span-2">
        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1">Nama Almarhum/Almarhumah</label>
          <input type="text" name="nama_jenazah" class="input-style !py-2.5 !px-3" placeholder="Contoh: Fatimah" required>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1">NIK Almarhum/Almarhumah</label>
          <input type="text" name="nik_jenazah" class="input-style !py-2.5 !px-3" placeholder="16 digit NIK" maxlength="16" required>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 col-span-1 md:col-span-2">
        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1">Hari/Tanggal Meninggal</label>
          <input type="date" name="tanggal_meninggal" class="input-style !py-2.5 !px-3" required>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1">Pukul/Jam Kematian</label>
          <input type="time" name="jam_meninggal" class="input-style !py-2.5 !px-3" required>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 col-span-1 md:col-span-2">
        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1">Tempat Meninggal</label>
          <input type="text" name="tempat_meninggal" class="input-style !py-2.5 !px-3" placeholder="Contoh: RS Zainoel Abidin" required>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1">Penyebab Meninggal</label>
          <input type="text" name="penyebab_meninggal" class="input-style !py-2.5 !px-3" placeholder="Contoh: Sakit / Usia Lanjut" required>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1">Hubungan Pelapor dengan Almarhum</label>
          <input type="text" name="hubungan_pelapor" class="input-style !py-2.5 !px-3" placeholder="Contoh: Anak Kandung / Istri" required>
        </div>
      </div>
    `;
  }

  if (fieldsHtml) {
    body.innerHTML = fieldsHtml;
    container.classList.remove('hidden');
  } else {
    container.classList.add('hidden');
    body.innerHTML = '';
  }

  // Update Syarat Dokumen Pendukung display
  const uploadLabel = el('#uploadDocLabel') || document.querySelector('label[for="fileInput"]') || el('#fileInput')?.parentElement?.parentElement?.querySelector('label');
  const fileNameDisplay = el('#fileNameDisplay');
  const fileInput = el('#fileInput');
  const syaratAlert = el('#syaratDokumenAlert');
  const syaratText = el('#syaratDokumenText');
  
  if (jenis && jenis.syarat_dokumen) {
    if (uploadLabel) {
      uploadLabel.innerHTML = `<span class="text-red-600 font-bold"><i class="fa-solid fa-asterisk mr-1 text-xs"></i>Wajib Upload:</span> ${jenis.syarat_dokumen}`;
    }
    if (fileNameDisplay && fileNameDisplay.textContent.includes('Klik atau seret')) {
      fileNameDisplay.textContent = `Klik atau seret file [${jenis.syarat_dokumen}] ke sini untuk mengunggah`;
    }
    if (fileInput) fileInput.required = true;
    if (syaratAlert && syaratText) {
      syaratText.textContent = jenis.syarat_dokumen;
      syaratAlert.classList.remove('hidden');
    }
  } else {
    if (uploadLabel) {
      uploadLabel.innerHTML = `Dokumen Pendukung Lainnya (Opsional)`;
    }
    if (fileNameDisplay && fileNameDisplay.textContent.includes('Klik atau seret')) {
      fileNameDisplay.textContent = `Klik atau seret file ke sini untuk mengunggah`;
    }
    if (fileInput) fileInput.required = false;
    if (syaratAlert) syaratAlert.classList.add('hidden');
  }
}

let activityChartInstance = null;

function updateActiveMenuState() {
  const path = window.location.pathname.toLowerCase();
  const activeMenuMap = {
    'dashboard.html': 'home',
    'pengajuan.html': 'pengajuan',
    'riwayat.html': 'my',
    'verifikasi.html': 'admin',
    'template.html': 'jenis',
    'audit-logs.html': 'audit',
    'buat-surat-warga.html': 'onbehalf',
    'daftar-warga.html': 'warga',
    'surat-keluar.html': 'suratkeluar'
  };
  const activeMenu = Object.keys(activeMenuMap).find(k => path.includes(k));
  if (activeMenu) {
     const menuKey = activeMenuMap[activeMenu];
     els('.dash-menu').forEach(m => m.classList.remove('bg-primary/10', 'border-r-4', 'border-primary', 'text-primary'));
     const activeBtn = el(`.dash-menu[data-menu="${menuKey}"]`);
     if(activeBtn) activeBtn.classList.add('bg-primary/10', 'border-r-4', 'border-primary', 'text-primary');
  }
}

function switchAuthTab(tabName) {
  if (tabName === 'login') {
    el('#loginForm').classList.remove('hidden');
    el('#registerForm').classList.add('hidden');
    el('#tabBtnLogin').className = 'flex-1 py-3 font-bold text-primary border-b-2 border-primary transition-all';
    el('#tabBtnRegister').className = 'flex-1 py-3 font-medium text-gray-500 border-b-2 border-transparent transition-all hover:text-primary';
  } else {
    el('#loginForm').classList.add('hidden');
    el('#registerForm').classList.remove('hidden');
    el('#tabBtnLogin').className = 'flex-1 py-3 font-medium text-gray-500 border-b-2 border-transparent transition-all hover:text-primary';
    el('#tabBtnRegister').className = 'flex-1 py-3 font-bold text-primary border-b-2 border-primary transition-all';
  }
}

// Extractor Fetch wrapper
async function apiFetch(path, opts={}){
  opts.headers = opts.headers || {};
  if (!opts.headers['Content-Type'] && !(opts.body instanceof FormData)) {
    opts.headers['Content-Type']='application/json';
  }
  const token = localStorage.getItem('token');
  if (token) opts.headers['Authorization']='Bearer '+token;
  
  if (opts.body && opts.headers['Content-Type']==='application/json') {
     opts.body = JSON.stringify(opts.body);
  }
  try {
    const res = await fetch(apiBase+path, opts);
    return await res.json();
  } catch(e) {
    return {success:false, message:'Gagal menghubungi server'};
  }
}

// --- AUTH LOGIC ---
if(el('#registerForm')) {
  el('#registerForm').addEventListener('submit', async e=>{
    e.preventDefault();
    showLoader();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    const r = await apiFetch('/auth/register', {method:'POST', body});
    hideLoader();
    if(r.success) { 
      showToast('Registrasi berhasil! Mengalihkan ke halaman login...'); 
      setTimeout(() => { window.location.href = 'auth.html'; }, 1500);
    }
    else showToast(r.message||JSON.stringify(r));
  });
}

if(el('#loginForm')) {
  el('#loginForm').addEventListener('submit', async e=>{
    e.preventDefault();
    showLoader();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    const r = await apiFetch('/auth/login', {method:'POST', body});
    hideLoader();
    if (r.token) { 
      localStorage.setItem('token', r.token); 
      await refreshProfile(); 
      showToast('Login berhasil!');
    }
    else showToast(r.message||'Login gagal');
  });
}

if(el('#btnLogout')) {
  el('#btnLogout').addEventListener('click', ()=>{ 
    localStorage.removeItem('token'); 
    refreshProfile(); 
    showToast('Sesi diakhiri.'); 
  });
}

async function refreshProfile(){
  const token = localStorage.getItem('token');
  const path = window.location.pathname.toLowerCase();
  
  const isDashboardPage = path.includes('dashboard.html') || 
                          path.includes('pengajuan.html') || 
                          path.includes('riwayat.html') || 
                          path.includes('verifikasi.html') || 
                          path.includes('template.html') ||
                          path.includes('audit-logs.html') ||
                          path.includes('buat-surat-warga.html') ||
                          path.includes('daftar-warga.html') ||
                          path.includes('surat-keluar.html');
                          
  const isAuthOrHome = path.includes('auth.html') || path.includes('register.html') || path.includes('index.html') || path === '/' || path.endsWith('/frontend/');

  if (!token){ 
     if(isDashboardPage) window.location.href = 'auth.html';
     return; 
  }
  showLoader();
  const r = await apiFetch('/auth/profile', {method:'GET'});
  hideLoader();
  if (r.success){ 
     window.currentUser = r.data;
     // If we are on public pages but logged in, bounce to dashboard
     if(isAuthOrHome && !isDashboardPage) {
        window.location.href = 'dashboard.html';
        return;
     }

      if(isDashboardPage) {
        if (el('#sideUserName')) el('#sideUserName').textContent = r.data.nama;
        if (el('#sideUserRole')) el('#sideUserRole').textContent = r.data.role.replace('_', ' ');
        if (el('#userAvatar')) el('#userAvatar').textContent = r.data.nama.charAt(0).toUpperCase();

        // Inject Edit Profile link in sidebar
        const userRoleEl = el('#sideUserRole');
        if (userRoleEl && !el('#editProfileLink')) {
          const link = document.createElement('a');
          link.id = 'editProfileLink';
          link.href = '#';
          link.className = 'text-[11px] text-gray-400 hover:text-primary transition-colors flex items-center gap-1 mt-1';
          link.innerHTML = '<i class="fa-solid fa-user-pen text-[10px]"></i> Edit Profil Saya';
          link.addEventListener('click', (e) => {
            e.preventDefault();
            showProfileModal(window.currentUser);
          });
          userRoleEl.parentNode.appendChild(link);
        }

        // Setup Role UI
        if (r.data.role === 'operator' || r.data.role === 'kepala_desa') {
           if(el('#adminMenuContainer')) {
              el('#adminMenuContainer').classList.remove('hidden');
              
              if (r.data.role === 'operator') {
                 // Inject "Buat Surat Warga" dynamically for Operator only
                 if (!el('#onBehalfMenuLink')) {
                    const divider = el('#adminMenuContainer').querySelector('.text-xs');
                    const link = document.createElement('a');
                    link.id = 'onBehalfMenuLink';
                    link.href = 'buat-surat-warga.html';
                    link.setAttribute('data-menu', 'onbehalf');
                    link.className = 'dash-menu w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-gray-700 hover:bg-gray-100 transition-colors';
                    link.innerHTML = '<i class="fa-solid fa-user-plus w-5 text-center"></i> Buat Surat Warga';
                    if (divider && divider.nextSibling) {
                       el('#adminMenuContainer').insertBefore(link, divider.nextSibling);
                    } else {
                       el('#adminMenuContainer').appendChild(link);
                    }
                 }
                 // Inject "Daftar Warga" dynamically for Operator only
                 if (!el('#daftarWargaMenuLink')) {
                    const divider = el('#adminMenuContainer').querySelector('.text-xs');
                    const link = document.createElement('a');
                    link.id = 'daftarWargaMenuLink';
                    link.href = 'daftar-warga.html';
                    link.setAttribute('data-menu', 'users');
                    link.className = 'dash-menu w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-gray-700 hover:bg-gray-100 transition-colors';
                    link.innerHTML = '<i class="fa-solid fa-users w-5 text-center"></i> Daftar Warga';
                    
                    const onBehalfLink = el('#onBehalfMenuLink');
                    if (onBehalfLink && onBehalfLink.nextSibling) {
                       el('#adminMenuContainer').insertBefore(link, onBehalfLink.nextSibling);
                    } else if (divider && divider.nextSibling) {
                       el('#adminMenuContainer').insertBefore(link, divider.nextSibling);
                    } else {
                       el('#adminMenuContainer').appendChild(link);
                    }
                 }
                 // Show template menu for Operator only
                 els('.dash-menu[data-menu="jenis"]').forEach(el => el.classList.remove('hidden'));
              } else {
                 // For kepala_desa: Hide template menu
                 els('.dash-menu[data-menu="jenis"]').forEach(el => el.classList.add('hidden'));
                 // Remove dynamic links if they exist for operator
                 if (el('#onBehalfMenuLink')) el('#onBehalfMenuLink').remove();
                 if (el('#daftarWargaMenuLink')) el('#daftarWargaMenuLink').remove();
              }
           }
           // Hide warga menus for admin/operator
           els('.dash-menu[data-menu="pengajuan"]').forEach(el => el.classList.add('hidden'));
           els('.dash-menu[data-menu="my"]').forEach(el => el.classList.add('hidden'));
           
           // Kepala Desa security block from administrative pages
           if (r.data.role === 'kepala_desa') {
              if (path.includes('buat-surat-warga.html') || path.includes('daftar-warga.html') || path.includes('template.html')) {
                 window.location.href = 'dashboard.html';
                 return;
              }
           }
        } else {
           if(el('#adminMenuContainer')) el('#adminMenuContainer').classList.add('hidden');
           // Show warga menus for citizens
           els('.dash-menu[data-menu="pengajuan"]').forEach(el => el.classList.remove('hidden'));
           els('.dash-menu[data-menu="my"]').forEach(el => el.classList.remove('hidden'));
           // Citizen security block from admin pages
           if (path.includes('verifikasi.html') || path.includes('template.html') || path.includes('audit-logs.html') || path.includes('buat-surat-warga.html') || path.includes('daftar-warga.html') || path.includes('surat-keluar.html')) {
              window.location.href = 'dashboard.html';
              return;
           }
        }
       
       updateActiveMenuState();
        // Page direct data loading
        if (path.includes('dashboard.html')) {
           loadDashboardStats();
           
           const isAdminRole = (currentUser.role === 'operator' || currentUser.role === 'kepala_desa');
           const cardTotal = el('#cardTotal');
           const cardPending = el('#cardPending');
           const cardSelesai = el('#cardSelesai');
           
           if (cardTotal) {
             cardTotal.addEventListener('click', () => {
               window.location.href = isAdminRole ? 'verifikasi.html?filter=all' : 'riwayat.html';
             });
           }
           if (cardPending) {
             cardPending.addEventListener('click', () => {
               window.location.href = isAdminRole ? 'verifikasi.html?filter=menunggu_verifikasi' : 'riwayat.html?filter=pending';
             });
           }
           if (cardSelesai) {
             cardSelesai.addEventListener('click', () => {
               window.location.href = isAdminRole ? 'verifikasi.html?filter=disetujui' : 'riwayat.html?filter=selesai';
             });
           }
        }
        if (path.includes('pengajuan.html')) loadJenisSuratOptions();
        if (path.includes('riwayat.html')) loadMyPengajuan();
        if (path.includes('verifikasi.html')) {
           const urlParams = new URLSearchParams(window.location.search);
           const filter = urlParams.get('filter') || 'all';
           loadAdmin(filter);
        };
       if (path.includes('template.html')) loadJenisAdminList();
       if (path.includes('audit-logs.html')) loadAuditLogs();
       if (path.includes('daftar-warga.html')) loadWargaList();
       if (path.includes('surat-keluar.html')) loadSuratKeluarList();
       
        // Start real-time updates
        initRealtime();
     }
  } else { 
     localStorage.removeItem('token');
     if(isDashboardPage) window.location.href = 'auth.html';
  }
}

// --- DASHBOARD LOGIC ---

function getStatusBadge(status) {
   switch(status.toLowerCase()) {
      case 'pending': return '<span class="status-badge bg-yellow-100 text-yellow-700 border border-yellow-200">Pending</span>';
      case 'menunggu_verifikasi': return '<span class="status-badge bg-orange-100 text-orange-700 border border-orange-200">Menunggu Verifikasi</span>';
      case 'terverifikasi': return '<span class="status-badge bg-purple-100 text-purple-700 border border-purple-200">Menunggu Persetujuan</span>';
      case 'menunggu_persetujuan': return '<span class="status-badge bg-purple-100 text-purple-700 border border-purple-200">Menunggu Persetujuan</span>';
      case 'disetujui': return '<span class="status-badge bg-green-100 text-green-700 border border-green-200">Disetujui</span>';
      case 'selesai': return '<span class="status-badge bg-gray-100 text-gray-700 border border-gray-200"><i class="fa-solid fa-check"></i> Selesai</span>';
      case 'ditolak': return '<span class="status-badge bg-red-100 text-red-700 border border-red-200">Ditolak</span>';
      default: return `<span class="status-badge bg-gray-100 text-gray-600">${status}</span>`;
   }
}

async function loadDashboardStats() {
  const r = await apiFetch('/pengajuan/me?limit=1000', {method:'GET'});
  let data = [];
  if(r.success) data = r.data;
  
  // If admin, we should fetch /pengajuan to get overall stats
  let isAdmin = false;
  if(!el('#adminMenuContainer').classList.contains('hidden')) isAdmin = true;
  
  if(isAdmin) {
     const ra = await apiFetch('/pengajuan?limit=1000', {method:'GET'});
     if(ra.success) data = ra.data;
  }

  el('#statTotal').textContent = data.length;
  el('#statPending').textContent = data.filter(x => x.status === 'menunggu_verifikasi' || x.status === 'terverifikasi' || x.status === 'menunggu_persetujuan').length;
  el('#statSelesai').textContent = data.filter(x => x.status === 'disetujui' || x.status === 'selesai' || x.file_surat).length;

  // Chart setup
  const ctx = document.getElementById('activityChart');
  if(activityChartInstance) activityChartInstance.destroy();
  
  if(ctx) {
     const countsByStatus = data.reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
     }, {});
     
     const labels = ['Menunggu Verifikasi', 'Menunggu Persetujuan', 'Disetujui', 'Ditolak'];
     const statusMap = {
        'menunggu verifikasi': 'menunggu_verifikasi',
        'menunggu persetujuan': 'terverifikasi',
        'disetujui': 'disetujui',
        'ditolak': 'ditolak'
     };
     const chartData = labels.map(l => countsByStatus[statusMap[l.toLowerCase()]] || 0);

     activityChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
           labels: labels,
           datasets: [{
              label: 'Jumlah Pengajuan',
              data: chartData,
              backgroundColor: ['#fde047', '#a855f7', '#86efac', '#fca5a5'],
              borderColor: ['#eab308', '#a855f7', '#22c55e', '#ef4444'],
              borderWidth: 1,
              borderRadius: 8
           }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
     });
  }

  const targetPage = isAdmin ? 'verifikasi.html' : 'riwayat.html';
  
  // Recent activity mock
  const recent = data.slice(0, 5);
  const rList = el('#recentActivityList');
  if(recent.length === 0) {
      rList.innerHTML = '<p class="text-sm text-gray-400 text-center py-4">Belum ada aktivitas.</p>';
  } else {
      rList.innerHTML = recent.map(x => `
         <div class="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50/80 transition-colors px-2 rounded-lg" onclick="window.location.href='${targetPage}'">
            <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs"><i class="fa-solid fa-file"></i></div>
            <div class="flex-1">
              <p class="font-bold text-sm text-gray-700">${x.nama_jenis}</p>
              <p class="text-xs text-gray-500">${x.keperluan}</p>
            </div>
            <div>${getStatusBadge(x.status)}</div>
         </div>
      `).join('');
  }
}

// --- PENGAJUAN ---
async function loadJenisSuratOptions(){
  const sel = el('#jenis');
  if (!sel) return;
  showLoader();
  const r = await apiFetch('/jenis-surat', {method:'GET'});
  hideLoader();
  if (r.success && r.data){ 
    window.allJenisSurat = r.data;
    sel.innerHTML = '<option value="">-- Pilih Jenis Surat --</option>';
    r.data.forEach(jenis => {
      sel.insertAdjacentHTML('beforeend', `<option value="${jenis.id_jenis}">${jenis.nama_jenis}</option>`);
    });
    
    // Bind change listener for dynamic fields
    sel.onchange = function() {
      handleJenisSuratChange(this);
    };

    // Check if we are in revision mode
    const urlParams = new URLSearchParams(window.location.search);
    const reviseId = urlParams.get('revise');
    if (reviseId) {
      showLoader();
      const reqDetails = await apiFetch(`/pengajuan/${reviseId}`, {method:'GET'});
      hideLoader();
      if (reqDetails.success && reqDetails.data) {
        const p = reqDetails.data;
        window.reviseId = reviseId;
        
        // Pre-fill fields
        sel.value = p.id_jenis;
        handleJenisSuratChange(sel);
        
        if (el('#keperluan')) el('#keperluan').value = p.keperluan;
        
        // Pre-fill keterangan/dynamic fields
        if (p.keterangan) {
          try {
            const parsed = JSON.parse(p.keterangan);
            if (parsed && parsed.is_dynamic && parsed.fields) {
              if (el('#keterangan')) el('#keterangan').value = parsed.keterangan_tambahan || '';
              // Pre-fill the dynamic input fields
              const dynamicBody = document.getElementById('dynamicFieldsBody');
              if (dynamicBody) {
                for (const [key, val] of Object.entries(parsed.fields)) {
                  const input = dynamicBody.querySelector(`[name="${key}"]`);
                  if (input) input.value = val;
                }
              }
            } else {
              if (el('#keterangan')) el('#keterangan').value = p.keterangan || '';
            }
          } catch(e) {
            if (el('#keterangan')) el('#keterangan').value = p.keterangan || '';
          }
        }
        
        // Visual cues for Revision Mode
        if (el('#pageTitle')) el('#pageTitle').textContent = "Revisi Pengajuan Surat";
        const formTitle = document.querySelector('#dash-pengajuan h3') || document.querySelector('.glass-card h3');
        if (formTitle) formTitle.innerHTML = `<i class="fa-solid fa-pen-to-square text-amber-500 mr-2"></i> Revisi & Kirim Ulang Pengajuan`;
        const submitBtn = document.querySelector('#pengajuanForm button[type="submit"]');
        if (submitBtn) submitBtn.textContent = "Kirim Ulang Pengajuan";
      }
    }
  } else {
    showToast('Gagal memuat jenis surat');
  }
}

if(el('#fileInput')) {
  el('#fileInput').addEventListener('change', e => {
     if(e.target.files.length > 1) {
       const names = Array.from(e.target.files).map(f => f.name).join(', ');
       el('#fileNameDisplay').innerHTML = `<i class="fa-solid fa-check-double text-green-500 mr-2"></i> ${e.target.files.length} file terpilih (${names})`;
     } else if(e.target.files.length === 1) {
       el('#fileNameDisplay').innerHTML = `<i class="fa-solid fa-check text-green-500 mr-2"></i> ${e.target.files[0].name}`;
     }
  });
}

if(el('#templateFileInput')) {
  el('#templateFileInput').addEventListener('change', e => {
     if(e.target.files.length) el('#templateFileNameDisplay').innerHTML = `<i class="fa-solid fa-check text-green-500 mr-2"></i> ${e.target.files[0].name}`;
  });
}

if(el('#pengajuanForm')) {
  el('#pengajuanForm').addEventListener('submit', async e=>{
    e.preventDefault();
    showLoader();
    const token = localStorage.getItem('token'); 
    const fd = new FormData(e.target);
    
    // Collect all dynamic fields if container is visible
    const dynamicBody = document.getElementById('dynamicFieldsBody');
    const dynamicContainer = document.getElementById('dynamicFieldsContainer');
    let keteranganValue = fd.get('keterangan') || '';

    if (dynamicContainer && !dynamicContainer.classList.contains('hidden') && dynamicBody) {
      const dynamicFieldsObj = {};
      dynamicBody.querySelectorAll('input, select, textarea').forEach(input => {
        dynamicFieldsObj[input.name] = input.value;
      });

      keteranganValue = JSON.stringify({
        is_dynamic: true,
        keterangan_tambahan: keteranganValue,
        fields: dynamicFieldsObj
      });
    }

    // Make form payload
    const body = { 
      id_jenis: fd.get('id_jenis'), 
      keperluan: fd.get('keperluan'), 
      keterangan: keteranganValue
    };
    
    let url = '/pengajuan';
    let method = 'POST';
    if (window.reviseId) {
      url = `/pengajuan/${window.reviseId}`;
      method = 'PUT';
    }
    
    const r = await apiFetch(url, {method, body});
    
    if (r.success){
      const id = window.reviseId || r.data.id_pengajuan;
      const fileEl = el('#fileInput');
      if (fileEl.files && fileEl.files.length){
        const ffd = new FormData(); 
        for (let i = 0; i < fileEl.files.length; i++) {
          ffd.append('files', fileEl.files[i]);
        }
        await fetch(apiBase+`/pengajuan/${id}/upload`, {method:'POST', headers:{'Authorization':'Bearer '+token}, body:ffd});
      }
      hideLoader();
      showToast(r.message || 'Pengajuan berhasil dikirim.'); 
      e.target.reset();
      el('#fileNameDisplay').textContent = "Upload File Pendukung";
      window.location.href = 'riwayat.html';
    } else {
      hideLoader();
      showToast(r.message||'Gagal buat pengajuan');
    }
  });
}

// --- MY PENGAJUAN ---
async function loadMyPengajuan(silent = false){
  if (!silent) showLoader();
  const r = await apiFetch('/pengajuan/me', {method:'GET'});
  if (!silent) hideLoader();
  const tbody = el('#myTableBody'); tbody.innerHTML='';
  if (r.success && r.data.length){ 
     const urlParams = new URLSearchParams(window.location.search);
     const filter = urlParams.get('filter');
     
     let filteredData = r.data;
     if (filter === 'pending') {
        filteredData = r.data.filter(x => x.status === 'menunggu_verifikasi' || x.status === 'terverifikasi' || x.status === 'menunggu_persetujuan');
     } else if (filter === 'selesai') {
        filteredData = r.data.filter(x => x.status === 'disetujui' || x.status === 'selesai');
     }
     
     if (filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="py-10 text-center text-gray-400">Tidak ada pengajuan dengan status ${filter === 'pending' ? 'proses verifikasi' : 'selesai'}</td></tr>`;
        return;
     }

     filteredData.forEach(p=>{
        let btn = '';
        if (p.status === 'disetujui' || p.status === 'selesai' || p.file_surat) {
          btn = `<button class="btn-primary !px-3 !py-1 text-xs" onclick="downloadPdf(${p.id_pengajuan})"><i class="fa-solid fa-download mr-1"></i> PDF</button>`;
        } else if (p.status === 'ditolak') {
          const cleanNote = (p.catatan_ditolak || 'Tidak ada catatan').replace(/'/g, "\\'").replace(/"/g, '&quot;');
          btn = `
             <div class="flex items-center gap-2 justify-end">
               <button class="btn-outline border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white !px-3 !py-1 text-xs" onclick="customAlert('Catatan Penolakan', '${cleanNote}', 'fa-message', 'text-amber-600', 'bg-amber-50')"><i class="fa-solid fa-message mr-1"></i> Catatan</button>
               <button class="btn-primary bg-red-500 hover:bg-red-600 text-white !px-3 !py-1 text-xs border-0" onclick="window.location.href='pengajuan.html?revise=${p.id_pengajuan}'"><i class="fa-solid fa-pen-to-square mr-1"></i> Revisi</button>
             </div>
           `;
        } else {
          btn = `<button class="btn-outline !px-3 !py-1 text-xs" onclick="customAlert('Status Proses', 'Proses pengajuan surat ini sedang berjalan. Mohon tunggu verifikasi dan persetujuan dari perangkat desa.', 'fa-hourglass-half', 'text-blue-600', 'bg-blue-50')"><i class="fa-solid fa-hourglass-half"></i> Proses</button>`;
        }
        
        tbody.insertAdjacentHTML('beforeend', `
          <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 font-medium text-gray-900">#${p.id_pengajuan}</td>
            <td class="px-6 py-4 text-sm">${p.nama_jenis}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${p.keperluan}</td>
            <td class="px-6 py-4">${getStatusBadge(p.status)}</td>
            <td class="px-6 py-4 text-right">${btn}</td>
          </tr>
        `);
     });
  } else {
     tbody.innerHTML = '<tr><td colspan="5" class="py-10 text-center text-gray-400">Belum ada data pengajuan</td></tr>';
  }
}

// --- ADMIN KELOLA PENGAJUAN ---
let currentAdminFilterStatus = 'all';

async function loadAdmin(status = currentAdminFilterStatus, silent = false) {
  currentAdminFilterStatus = status;
  
  // Update tabs UI
  const tabContainer = el('#adminFilterTabs');
  if (tabContainer) {
    const tabs = els('.admin-tab-btn');
    tabs.forEach(tab => {
      if (tab.getAttribute('data-status') === status) {
        tab.className = 'admin-tab-btn px-4 py-2 text-xs font-bold rounded-xl transition-all bg-primary text-white shadow-sm';
      } else {
        tab.className = 'admin-tab-btn px-4 py-2 text-xs font-bold rounded-xl transition-all bg-white text-gray-600 border border-gray-200 hover:bg-gray-100';
      }
    });
  }

  if (!silent) showLoader();
  const query = status && status !== 'all' ? `?status=${status}&limit=100` : '?limit=100';
  const r = await apiFetch(`/pengajuan${query}`, {method:'GET'});
  if (!silent) hideLoader();
  
  const tbody = el('#adminTableBody'); 
  if (!tbody) return;
  tbody.innerHTML = '';
  
  if (r.success && r.data.length){ 
     r.data.forEach(p=>{
        tbody.insertAdjacentHTML('beforeend', `
          <tr class="hover:bg-primary/5 transition-colors">
            <td class="px-6 py-4 font-bold text-gray-700">#${p.id_pengajuan}</td>
            <td class="px-6 py-4 text-sm font-medium"><div class="flex items-center gap-2"><div class="w-6 h-6 rounded bg-gray-200 flex items-center justify-center text-[10px] uppercase">${p.nama_pemohon[0]}</div>${p.nama_pemohon}</div></td>
            <td class="px-6 py-4 text-sm text-gray-600">${p.nama_jenis}</td>
            <td class="px-6 py-4 text-center">${getStatusBadge(p.status)}</td>
            <td class="px-6 py-4 text-center">
               <button class="btn-secondary !px-3 !py-1.5 !inline-flex text-xs" onclick="openDetailPanel(${p.id_pengajuan})"><i class="fa-solid fa-list-check"></i> Proses</button>
            </td>
          </tr>
        `);
     });
  } else {
     tbody.innerHTML = '<tr><td colspan="5" class="py-10 text-center text-gray-400">Tidak ada pengajuan ditemukan</td></tr>';
  }
}

// Bind tabs setup
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.admin-tab-btn');
  if (btn) {
    const status = btn.getAttribute('data-status');
    loadAdmin(status);
  }
});

// --- DETAIL & ACTION MODAL ---
function hideModal(){ el('#modal').classList.add('hidden'); el('#modal').classList.remove('flex'); el('#modalBody').innerHTML=''; }

window.openDetailPanel = async function(id){
  showLoader();
  const r = await apiFetch(`/pengajuan/${id}`, {method:'GET'});
  const ri = await apiFetch(`/pengajuan/${id}/riwayat`, {method:'GET'});
  const rf = await apiFetch(`/pengajuan/${id}/files`, {method:'GET'});
  hideLoader();
    if (!r.success) return showToast('Gagal memuat detail');
  const p = r.data;
  const history = ri.success ? ri.data : [];
  const filesList = rf.success ? rf.data : [];
  
  let fileL = '<p class="text-gray-400 text-sm mt-1">Tidak ada file lampiran pendukung</p>';
  if (filesList.length > 0) {
    fileL = '<div class="grid grid-cols-1 gap-2.5 mt-2">' + filesList.map(f => {
      const fileName = f.split('/').pop();
      let icon = '<i class="fa-solid fa-file-lines text-blue-500"></i>';
      let label = 'Dokumen Lampiran';
      if (f.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        icon = '<i class="fa-solid fa-image text-emerald-500"></i>';
        label = 'Foto Lampiran';
      } else if (f.match(/\.(pdf)$/i)) {
        icon = '<i class="fa-solid fa-file-pdf text-red-500"></i>';
        label = 'Dokumen PDF';
      } else if (f.match(/\.(doc|docx)$/i)) {
        icon = '<i class="fa-solid fa-file-word text-blue-600"></i>';
        label = 'Dokumen Word';
      }
      return `
        <div class="border rounded-xl p-3.5 bg-white shadow-sm flex items-center justify-between hover:border-primary/40 transition-all">
          <div class="flex items-center gap-3 overflow-hidden">
            <div class="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg flex-shrink-0 border border-gray-100">
              ${icon}
            </div>
            <div class="min-w-0">
              <p class="text-xs font-bold text-gray-700 truncate">${label}</p>
              <p class="text-[11px] text-gray-400 truncate">${fileName}</p>
            </div>
          </div>
          <a href="${serverBase}${f}" target="_blank" class="btn-outline !py-1.5 !px-3 text-xs flex items-center gap-1.5 flex-shrink-0 ml-2">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Buka / Lihat
          </a>
        </div>`;
    }).join('') + '</div>';
  } else if (p.status === 'menunggu_verifikasi' || p.status === 'menunggu_persetujuan' || p.status === 'ditolak') {
    if (p.file_surat) {
       fileL = `<a href="${serverBase}${p.file_surat}" target="_blank" class="text-blue-600 underline font-medium text-sm flex items-center gap-1 mt-1"><i class="fa-solid fa-paperclip"></i> Lihat Lampiran Pendukung</a>`;
    }
  };

  let riwHtml = history.length ? history.map(x=> `<li class="text-xs text-gray-500 py-1"><i class="fa-solid fa-check text-green-500 w-4"></i> ${x.tanggal_cetak} - ${x.status_cetak}</li>`).join('') : '<p class="text-xs text-gray-400">Belum ada riwayat aktivitas sistem.</p>';

  let keteranganHtml = `<p class="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200 mt-1">${p.keterangan || '-'}</p>`;
  
  if (p.keterangan) {
    try {
      const parsed = JSON.parse(p.keterangan);
      if (parsed && parsed.is_dynamic && parsed.fields) {
        let fieldsRows = '';
        for (const [key, val] of Object.entries(parsed.fields)) {
          const cleanKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          fieldsRows += `
            <tr class="border-b last:border-0 border-gray-100">
              <td class="py-2 px-3 text-xs font-bold text-gray-500 bg-gray-50/50 w-1/3">${cleanKey}</td>
              <td class="py-2 px-3 text-sm text-gray-700 font-medium">${val}</td>
            </tr>
          `;
        }
        keteranganHtml = `
          <div class="mt-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table class="w-full text-left border-collapse">
              <tbody>
                ${fieldsRows}
                <tr class="border-t border-gray-200 bg-gray-100/30">
                  <td class="py-2 px-3 text-xs font-bold text-gray-500 pl-3">Catatan Tambahan</td>
                  <td class="py-2 px-3 text-sm text-gray-700 font-medium">${parsed.keterangan_tambahan || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        `;
      }
    } catch (e) {
      // Not JSON
    }
  }

  let actionButtons = '';
  const statusLower = (p.status || '').toLowerCase();
  const userRole = window.currentUser ? window.currentUser.role : 'operator';
  
  if (statusLower === 'menunggu_verifikasi') {
    actionButtons = `
      <button class="btn-outline !py-2.5 !px-4 text-xs" onclick="actVerify(${p.id_pengajuan})"><i class="fa-solid fa-magnifying-glass-check mr-1.5"></i> Verifikasi</button>
      <button class="btn-primary bg-red-600 hover:bg-red-700 !py-2.5 !px-4 text-xs border-0" onclick="actReject(${p.id_pengajuan})"><i class="fa-solid fa-ban mr-1.5"></i> Tolak</button>
    `;
  } else if (statusLower === 'terverifikasi' || statusLower === 'menunggu_persetujuan') {
    if (userRole === 'kepala_desa') {
      actionButtons = `
        <button class="btn-primary bg-green-600 hover:bg-green-700 !py-2.5 !px-4 text-xs border-0" onclick="actApprove(${p.id_pengajuan})"><i class="fa-solid fa-signature mr-1.5"></i> Setujui</button>
        <button class="btn-primary bg-red-600 hover:bg-red-700 !py-2.5 !px-4 text-xs border-0" onclick="actReject(${p.id_pengajuan})"><i class="fa-solid fa-ban mr-1.5"></i> Tolak</button>
      `;
    } else {
      actionButtons = `
        <div class="col-span-2 text-center text-xs text-purple-600 font-bold bg-purple-50 p-3 rounded-xl border border-purple-100 w-full">
          <i class="fa-solid fa-clock mr-1.5"></i> Menunggu persetujuan Kepala Desa
        </div>
      `;
    }
  } else if (statusLower === 'disetujui') {
    actionButtons = `
      <button class="btn-primary bg-primary hover:bg-[#3f5231] !py-2.5 !px-6 text-xs border-0 col-span-2 w-full" onclick="downloadPdf(${p.id_pengajuan})"><i class="fa-solid fa-file-arrow-down mr-1.5"></i> Unduh PDF Surat</button>
    `;
  } else if (statusLower === 'ditolak') {
    actionButtons = `
      <div class="col-span-2 text-center text-xs text-red-500 font-bold bg-red-50 p-3 rounded-xl border border-red-100 w-full">
        <i class="fa-solid fa-circle-xmark mr-1.5"></i> Pengajuan telah ditolak
      </div>
    `;
  }

  // KTP Preview
  let attachmentsHtml = '';
  if (p.foto_ktp) {
    const ktpUrl = p.foto_ktp.startsWith('data:') ? p.foto_ktp : `${serverBase}${p.foto_ktp}`;
    attachmentsHtml = `
      <div class="col-span-2 mt-2 pt-2 border-t border-dashed border-gray-200">
        <p class="text-xs text-gray-400 uppercase font-bold mb-2 text-left">Dokumen Verifikasi Identitas</p>
        <div class="max-w-md text-left">
          <span class="text-[10px] text-gray-400 font-bold mb-1 block">KTP Asli Pemohon</span>
          <a href="${ktpUrl}" target="_blank" class="block group relative rounded-xl overflow-hidden shadow border border-gray-200 bg-gray-100 aspect-[8.5/5.5]">
            <img src="${ktpUrl}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="KTP Warga" />
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold"><i class="fa-solid fa-magnifying-glass-plus mr-1"></i> Perbesar Foto KTP</div>
          </a>
        </div>
      </div>
    `;
  } else {
    attachmentsHtml = `
      <div class="col-span-2 mt-2 pt-2 border-t border-dashed border-gray-200">
        <p class="text-xs text-gray-400 uppercase font-bold mb-2 text-left">Dokumen Verifikasi Identitas</p>
        <div class="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-700 text-xs flex items-center gap-2">
          <i class="fa-solid fa-triangle-exclamation text-amber-500 text-sm"></i>
          <span>Warga ini belum mengunggah foto/scan KTP pada akunnya (akun lama / belum melengkapi dokumen identitas).</span>
        </div>
      </div>
    `;
  }

  const html = `
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
         <div class="text-left"><p class="text-xs text-gray-400 uppercase font-bold">Warga Pemohon</p><p class="font-bold text-gray-800">${p.nama_pemohon}</p></div>
         <div class="text-left"><p class="text-xs text-gray-400 uppercase font-bold">Status Berjalan</p><div class="mt-1">${getStatusBadge(p.status)}</div></div>
         <div class="col-span-2 text-left"><p class="text-xs text-gray-400 uppercase font-bold">Keperluan</p><p class="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200 mt-1">${p.keperluan}</p></div>
         <div class="col-span-2 text-left"><p class="text-xs text-gray-400 uppercase font-bold">Data Tambahan / Keterangan</p>${keteranganHtml}</div>
         <div class="col-span-2 text-left"><p class="text-xs text-gray-400 uppercase font-bold">File Pendukung</p>${fileL}</div>
         ${attachmentsHtml}
      </div>
      
      <div class="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-left">
         <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-2 mb-2">Riwayat Tindakan</h4>
         <ul>${riwHtml}</ul>
      </div>
  
      <div class="grid grid-cols-2 gap-2 pt-4 border-t border-gray-100 w-full">
         ${actionButtons}
      </div>
    </div>
  `;
  el('#modalBody').innerHTML = html; 
  el('#modal').classList.remove('hidden'); 
  el('#modal').classList.add('flex');;
}

// Action Handlers
window.actVerify = async function(id){ 
  showLoader(); const r = await apiFetch(`/pengajuan/${id}/verifikasi`, {method:'PUT', body:{status:'terverifikasi'}}); hideLoader();
  showToast(r.message); hideModal(); loadAdmin(); 
};
window.actReject = function(id){ 
  showCustomDialog({
    title: 'Tolak Pengajuan Surat',
    subtitle: 'Konfirmasi Penolakan',
    message: 'Silakan berikan alasan atau catatan mengapa pengajuan surat ini ditolak agar warga dapat mengetahui dan memperbaiki permohonannya:',
    icon: 'fa-ban',
    iconColor: 'text-red-600',
    iconBg: 'bg-red-50',
    btnOkText: 'Tolak & Kirim Catatan',
    btnOkClass: 'bg-red-600 hover:bg-red-700 text-white',
    showInput: true,
    inputLabel: 'Alasan / Catatan Penolakan (Wajib Diisi):',
    requiredInput: true,
    inputPlaceholder: 'Contoh: Foto KTP kurang jelas / Persyaratan belum lengkap...',
    onOk: async (note) => {
      showLoader(); 
      const r = await apiFetch(`/pengajuan/${id}/reject`, {method:'PUT', body:{catatan_ditolak:note}}); 
      hideLoader();
      showToast(r.message); 
      hideModal(); 
      loadAdmin();
    }
  });
};
window.actApprove = async function(id){ 
  showLoader(); const r = await apiFetch(`/pengajuan/${id}/approve`, {method:'PUT', body:{}}); hideLoader();
  showToast(r.message); hideModal(); loadAdmin(); 
};
window.actGenPDF = async function(id){ 
  showLoader(); const r = await apiFetch(`/pengajuan/${id}/generate`, {method:'POST'}); hideLoader();
  showToast(r.message); hideModal(); loadAdmin(); 
};
window.downloadPdf = function(id){
  const token = localStorage.getItem('token');
  if (!token) {
     showToast('Sesi Anda telah berakhir, silakan login kembali');
     return;
  }
  const downloadUrl = `${apiBase}/pengajuan/${id}/download?token=${token}`;
  window.location.href = downloadUrl;
}

// -- MASTER JENIS SURAT --
async function loadJenisAdminList(){
  showLoader();
  const res = await fetch(apiBase+'/jenis-surat');
  hideLoader();
  const j = await res.json().catch(()=>({success:false}));
  const tbody = el('#jenisTableBody');
  tbody.innerHTML = '';
  
  if (j.success){
    window.allJenisSurat = j.data;
    j.data.forEach(item=>{
      let fields = [];
      try {
        if (item.custom_fields) {
          fields = typeof item.custom_fields === 'string' ? JSON.parse(item.custom_fields) : item.custom_fields;
        }
      } catch(e){}
      const fieldCount = Array.isArray(fields) ? fields.length : 0;
      const cleanBody = item.body_template ? (item.body_template.length > 50 ? item.body_template.substring(0, 50) + '...' : item.body_template) : 'Template kalimat default';

      tbody.insertAdjacentHTML('beforeend', `
        <tr class="hover:bg-gray-50/30 transition-colors border-b border-gray-100">
          <td class="px-6 py-4">
            <div class="font-bold text-sm text-gray-800">${item.nama_jenis}</div>
            ${item.syarat_dokumen ? `<div class="mt-1"><span class="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-lg text-[9px] font-semibold"><i class="fa-solid fa-paperclip"></i> Syarat: ${item.syarat_dokumen}</span></div>` : ''}
          </td>
          <td class="px-6 py-4 text-xs text-gray-500 max-w-[150px] truncate" title="${item.deskripsi||'-'}">${item.deskripsi||'-'}</td>
          <td class="px-6 py-4 text-xs text-gray-500 italic max-w-[200px] truncate" title="${item.body_template||'-'}">${cleanBody}</td>
          <td class="px-6 py-4">
            <span class="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-xl text-[10px] font-bold">
              <i class="fa-solid fa-square-poll-horizontal"></i> ${fieldCount} Field Dinamis
            </span>
          </td>
          <td class="px-6 py-4">
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold border ${item.status === 'aktif' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}">
              ${item.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
            </span>
          </td>
          <td class="px-6 py-4 text-right">
             <div class="flex items-center justify-end gap-2">
               <button class="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors flex items-center justify-center w-8 h-8" title="Edit Template" onclick="editJenis(${item.id_jenis})">
                 <i class="fa-solid fa-pen text-[10px]"></i>
               </button>
               <button class="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors flex items-center justify-center w-8 h-8" title="Hapus Template" onclick="delJenis(${item.id_jenis})">
                 <i class="fa-solid fa-trash text-[10px]"></i>
               </button>
             </div>
          </td>
        </tr>
      `);
    });
  } else {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-xs py-10 text-gray-400">Tidak ada template surat.</td></tr>';
  }
}

let editJenisId = null;
window.addFieldRow = function(label = '', type = 'text') {
  const wrapper = el('#customFieldsWrapper');
  if (!wrapper) return;
  const id = 'field_' + Math.random().toString(36).substr(2, 9);
  const rowHtml = `
    <div id="${id}" class="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100 animate-fade-in group w-full">
      <input type="text" value="${label}" placeholder="Label Field (misal: Alamat Usaha)" class="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-secondary" required>
      <select class="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs w-[90px] focus:outline-none focus:ring-2 focus:ring-secondary">
        <option value="text" ${type === 'text' ? 'selected' : ''}>Teks</option>
        <option value="number" ${type === 'number' ? 'selected' : ''}>Angka</option>
        <option value="date" ${type === 'date' ? 'selected' : ''}>Tanggal</option>
        <option value="time" ${type === 'time' ? 'selected' : ''}>Jam</option>
        <option value="file" ${type === 'file' ? 'selected' : ''}>File/Foto</option>
      </select>
      <button type="button" onclick="document.getElementById('${id}').remove()" class="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0" title="Hapus Field">
        <i class="fa-solid fa-trash-can text-xs"></i>
      </button>
    </div>
  `;
  wrapper.insertAdjacentHTML('beforeend', rowHtml);
}

if (el('#btnAddField')) {
  el('#btnAddField').addEventListener('click', () => {
    window.addFieldRow();
  });
}

window.editJenis = function(id) {
   const item = window.allJenisSurat ? window.allJenisSurat.find(x => x.id_jenis === id) : null;
   if (!item) return;
   editJenisId = id;
   el('#jenisFormTitle').textContent = 'Edit Template #' + id;
   const form = el('#jenisForm');
   form.nama_jenis.value = item.nama_jenis;
   form.deskripsi.value = item.deskripsi || '';
   if (form.body_template) form.body_template.value = item.body_template || '';
   if (form.syarat_dokumen) form.syarat_dokumen.value = item.syarat_dokumen || '';
   el('#templateFileNameDisplay').textContent = "Unggah template (.docx atau Gambar)";
   el('#btnCancelJenis').classList.remove('hidden');

   // Populate custom fields
   const wrapper = el('#customFieldsWrapper');
   if (wrapper) {
      wrapper.innerHTML = '';
      let fields = [];
      try {
         if (item.custom_fields) {
            fields = typeof item.custom_fields === 'string' ? JSON.parse(item.custom_fields) : item.custom_fields;
         }
      } catch (e) { console.error(e); }
      if (Array.isArray(fields)) {
         fields.forEach(f => window.addFieldRow(f.label, f.type));
      }
   }
   
   if (el('#jenisModal')) el('#jenisModal').classList.remove('hidden');
}

if(el('#btnCancelJenis')) {
  el('#btnCancelJenis').addEventListener('click', () => {
    editJenisId = null;
    el('#jenisFormTitle').textContent = 'Buat Template Baru';
    el('#jenisForm').reset();
    if (el('#customFieldsWrapper')) el('#customFieldsWrapper').innerHTML = '';
    el('#templateFileNameDisplay').textContent = "Unggah template (.docx atau Gambar)";
    el('#btnCancelJenis').classList.add('hidden');
    if (el('#jenisModal')) el('#jenisModal').classList.add('hidden');
  });
}

window.openAddJenisModal = function() {
  editJenisId = null;
  el('#jenisFormTitle').textContent = 'Buat Template Baru';
  el('#jenisForm').reset();
  if (el('#customFieldsWrapper')) el('#customFieldsWrapper').innerHTML = '';
  el('#templateFileNameDisplay').textContent = "Unggah template (.docx atau Gambar)";
  el('#btnCancelJenis').classList.add('hidden');
  if (el('#jenisModal')) el('#jenisModal').classList.remove('hidden');
};

window.closeJenisModal = function() {
  if (el('#btnCancelJenis')) {
    el('#btnCancelJenis').click();
  } else if (el('#jenisModal')) {
    el('#jenisModal').classList.add('hidden');
  }
};

if(el('#jenisForm')) {
  el('#jenisForm').addEventListener('submit', async e=>{
    e.preventDefault();
    
    // Collect custom fields
    const fields = [];
    const wrapper = el('#customFieldsWrapper');
    if (wrapper) {
      const rows = wrapper.querySelectorAll('div[id^="field_"]');
      rows.forEach(row => {
        const input = row.querySelector('input');
        const select = row.querySelector('select');
        if (input && select) {
          const label = input.value.trim();
          const type = select.value;
          if (label) {
            const name = label.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
            fields.push({ name, label, type });
          }
        }
      });
    }

    const fd = new FormData(e.target);
    fd.append('custom_fields', JSON.stringify(fields));
    showLoader();
    
    const token = localStorage.getItem('token');
    const url = apiBase + (editJenisId ? `/jenis-surat/${editJenisId}` : '/jenis-surat');
    const method = editJenisId ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          'Authorization': 'Bearer ' + token
        },
        body: fd
      });
      const r = await res.json();
      hideLoader();
      if (r.success){ 
        showToast('Jenis surat tersimpan!'); 
        el('#btnCancelJenis').click();
        loadJenisAdminList(); 
      } else { 
        showToast(r.message || 'Gagal memproses jenis'); 
      }
    } catch (err) {
      hideLoader();
      showToast('Terjadi kesalahan jaringan');
    }
  });
}

window.delJenis = function(id) {
   customConfirm('Hapus Template Surat?', 'Hati-hati! Menghapus jenis surat ini bisa mengganggu riwayat pengajuan yang sudah menggunakan template ini. Lanjutkan?', async () => {
     showLoader();
     const r = await apiFetch(`/jenis-surat/${id}`, {method:'DELETE'});
     hideLoader();
     if(r.success || r.message) { showToast('Berhasil dihapus'); loadJenisAdminList(); }
     else showToast('Gagal menghapus');
   }, 'fa-triangle-exclamation', 'text-red-600', 'bg-red-50');
  }
 
let currentAuditPage = 1;
const auditLimit = 20;

async function loadAuditLogs(page = 1) {
  currentAuditPage = page;
  showLoader();
  const r = await apiFetch(`/audit-logs?page=${page}&limit=${auditLimit}`, { method: 'GET' });
  hideLoader();

  const tbody = el('#auditTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (r.success && r.data.length) {
    r.data.forEach(log => {
      const formattedDate = new Date(log.created_at).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      const userDisplay = log.nama_user 
        ? `<div class="font-bold text-gray-800">${log.nama_user}</div><div class="text-xs text-gray-400">${log.email_user}</div>`
        : `<span class="text-gray-400 italic">System / Unknown</span>`;
      
      const ipDisplay = (log.ip_address === '::1' || log.ip_address === '127.0.0.1' || log.ip_address === '::ffff:127.0.0.1')
        ? '127.0.0.1 (Localhost)'
        : (log.ip_address || '-');

      tbody.insertAdjacentHTML('beforeend', `
        <tr class="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
          <td class="px-6 py-4 text-xs font-semibold text-gray-500 whitespace-nowrap">${formattedDate}</td>
          <td class="px-6 py-4 text-sm">${userDisplay}</td>
          <td class="px-6 py-4 text-xs font-bold text-primary uppercase whitespace-nowrap">${log.aksi || '-'}</td>
          <td class="px-6 py-4 text-sm text-gray-600 max-w-xs md:max-w-md break-words">${log.deskripsi || '-'}</td>
          <td class="px-6 py-4 text-xs font-medium text-gray-500 whitespace-nowrap">${ipDisplay}</td>
        </tr>
      `);
    });

    // Update Pagination UI
    const pagination = r.pagination;
    const startIdx = (pagination.page - 1) * pagination.limit + 1;
    const endIdx = startIdx + r.data.length - 1;

    if (el('#auditPageStart')) el('#auditPageStart').textContent = startIdx;
    if (el('#auditPageEnd')) el('#auditPageEnd').textContent = endIdx;
    if (el('#auditTotalItems')) el('#auditTotalItems').textContent = pagination.totalData;

    const btnPrev = el('#btnPrevAudit');
    const btnNext = el('#btnNextAudit');

    if (btnPrev) {
      btnPrev.disabled = pagination.page <= 1;
      btnPrev.onclick = () => loadAuditLogs(pagination.page - 1);
    }
    if (btnNext) {
      btnNext.disabled = pagination.page >= pagination.totalPages;
      btnNext.onclick = () => loadAuditLogs(pagination.page + 1);
    }
  } else {
    tbody.innerHTML = '<tr><td colspan="5" class="py-10 text-center text-gray-400">Tidak ada log audit ditemukan</td></tr>';
  }
}

 // Initial Booting
window.addEventListener('DOMContentLoaded', () => {
  refreshProfile();
  setupResponsiveSidebar();
});

function setupResponsiveSidebar() {
  const authLayout = el('#authLayout');
  if (authLayout) {
    const sidebar = authLayout.querySelector('aside');
    const header = authLayout.querySelector('header');
    
    if (sidebar && header) {
      // Set ID for target selection in media query CSS
      if (!sidebar.id) sidebar.id = 'sidebar';
      
      // 1. Create a backdrop overlay
      let overlay = el('#sidebarOverlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sidebarOverlay';
        overlay.className = 'fixed inset-0 bg-black/40 z-30 hidden transition-opacity duration-300';
        authLayout.insertBefore(overlay, sidebar);
      }
      
      // 2. Create hamburger toggle button
      let toggleBtn = el('#btnToggleSidebar');
      if (!toggleBtn) {
        toggleBtn = document.createElement('button');
        toggleBtn.id = 'btnToggleSidebar';
        toggleBtn.className = 'md:hidden w-10 h-10 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-primary flex items-center justify-center shadow-sm mr-3 flex-shrink-0';
        toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
        
        const pageTitle = header.querySelector('#pageTitle');
        if (pageTitle) {
          const parent = pageTitle.parentNode;
          const wrapper = document.createElement('div');
          wrapper.className = 'flex items-center gap-2 md:gap-3 overflow-hidden';
          parent.insertBefore(wrapper, pageTitle);
          wrapper.appendChild(toggleBtn);
          wrapper.appendChild(pageTitle);
          pageTitle.classList.add('text-lg', 'md:text-2xl', 'truncate');
        } else {
          header.insertBefore(toggleBtn, header.firstChild);
        }
      }
      
      // 3. Bind toggle events
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.add('active');
        overlay.classList.remove('hidden');
      });
      
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.add('hidden');
      });
      
      // Close sidebar when clicking menu links on mobile
      els('.dash-menu').forEach(link => {
        link.addEventListener('click', () => {
          sidebar.classList.remove('active');
          overlay.classList.add('hidden');
        });
      });
    }
  }
}

function showProfileModal(userData) {
  let modal = document.getElementById('profileModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'profileModal';
    modal.className = 'fixed inset-0 z-[100] hidden items-center justify-center bg-black/40 backdrop-blur-sm';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl w-full max-w-md p-6 m-4 shadow-2xl animate-fade-in border border-gray-100 relative z-[110] text-left" style="max-height: 80vh; overflow-y: auto;">
        <div class="flex justify-between items-center mb-4 border-b pb-3">
          <h3 class="text-lg font-bold text-primary flex items-center gap-2">
            <i class="fa-solid fa-user-gear"></i> Lengkapi Profil Saya
          </h3>
          <button type="button" id="closeProfileModal" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-xl"></i></button>
        </div>
        
        <form id="profileForm" class="space-y-3">
          <div class="space-y-1">
            <label class="text-[11px] font-bold text-gray-500">Nomor Induk Kependudukan (NIK)</label>
            <input class="w-full bg-gray-100 border border-gray-250 rounded-xl px-3 py-2 text-sm text-gray-500 font-mono focus:outline-none cursor-not-allowed" name="nik" type="text" readonly />
          </div>
          <div class="space-y-1">
            <label class="text-[11px] font-bold text-gray-500">Nama Lengkap</label>
            <input class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white" name="nama" type="text" required />
          </div>
          <div class="space-y-1">
            <label class="text-[11px] font-bold text-gray-500">Nomor WhatsApp / HP</label>
            <input class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white" name="no_hp" type="text" placeholder="081234567890" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-[11px] font-bold text-gray-500">Tempat Lahir</label>
              <input class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white" name="tempat_lahir" type="text" required />
            </div>
            <div class="space-y-1">
              <label class="text-[11px] font-bold text-gray-500">Tanggal Lahir</label>
              <input class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white" name="tanggal_lahir" type="date" required />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-[11px] font-bold text-gray-500">Jenis Kelamin</label>
              <select class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white" name="jenis_kelamin" required>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-[11px] font-bold text-gray-500">Status Perkawinan</label>
              <select class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white" name="status_perkawinan" required>
                <option value="Belum Kawin">Belum Kawin</option>
                <option value="Kawin">Kawin</option>
                <option value="Cerai Hidup">Cerai Hidup</option>
                <option value="Cerai Mati">Cerai Mati</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-[11px] font-bold text-gray-500">Pekerjaan</label>
              <input class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white" name="pekerjaan" type="text" required />
            </div>
            <div class="space-y-1">
              <label class="text-[11px] font-bold text-gray-500">Agama</label>
              <input class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white" name="agama" type="text" required />
            </div>
          </div>
          <div class="space-y-1">
            <label class="text-[11px] font-bold text-gray-500">Alamat Lengkap</label>
            <textarea class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white" name="alamat" rows="2" required></textarea>
          </div>

          <div class="border-t pt-2 mt-2 space-y-2">
            <h4 class="text-xs font-bold text-primary"><i class="fa-solid fa-key"></i> Ganti Kata Sandi (Opsional)</h4>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-gray-500">Sandi Baru</label>
                <input class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white" name="password" id="profileNewPassword" type="password" placeholder="Sandi baru" />
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-gray-500">Konfirmasi Sandi</label>
                <input class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white" id="profileConfirmPassword" type="password" placeholder="Konfirmasi" />
              </div>
            </div>
          </div>
          
          <button class="w-full mt-3 bg-primary text-white py-2 rounded-xl text-sm font-bold shadow hover:bg-[#3f5231] transition-all flex items-center justify-center gap-2" type="submit">
            Simpan Profil <i class="fa-solid fa-floppy-disk"></i>
          </button>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('closeProfileModal').addEventListener('click', () => {
      modal.style.display = 'none';
      modal.classList.remove('flex');
      modal.classList.add('hidden');
    });

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const newPw = document.getElementById('profileNewPassword').value;
      const confPw = document.getElementById('profileConfirmPassword').value;
      if (newPw && newPw !== confPw) {
         return showToast('Konfirmasi kata sandi tidak cocok!');
      }

      showLoader();
      const fd = new FormData(e.target);
      const body = Object.fromEntries(fd.entries());
      if (!newPw) {
         delete body.password;
      }

      const r = await apiFetch('/auth/profile', { method: 'PUT', body });
      hideLoader();
      if (r.success) {
        showToast('Profil berhasil disimpan!');
        modal.style.display = 'none';
        modal.classList.remove('flex');
        modal.classList.add('hidden');
        await refreshProfile();
      } else {
        showToast(r.message || 'Gagal menyimpan profil');
      }
    });
  }

  // Populate values
  const form = document.getElementById('profileForm');
  form.elements['nik'].value = userData.nik || 'Tidak ada NIK';
  form.elements['nama'].value = userData.nama || '';
  if (form.elements['no_hp']) form.elements['no_hp'].value = userData.no_hp || '';
  form.elements['tempat_lahir'].value = userData.tempat_lahir || '';
  if (userData.tanggal_lahir) {
    form.elements['tanggal_lahir'].value = userData.tanggal_lahir.substring(0, 10);
  } else {
    form.elements['tanggal_lahir'].value = '';
  }
  form.elements['jenis_kelamin'].value = userData.jenis_kelamin || 'Laki-laki';
  form.elements['status_perkawinan'].value = userData.status_perkawinan || 'Belum Kawin';
  form.elements['pekerjaan'].value = userData.pekerjaan || '';
  form.elements['agama'].value = userData.agama || '';
  form.elements['alamat'].value = userData.alamat || '';
  document.getElementById('profileNewPassword').value = '';
  document.getElementById('profileConfirmPassword').value = '';

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  modal.style.display = 'flex';
}

// --- ON BEHALF FORM HANDLING (buat-surat-warga.html) ---
if (document.getElementById('onBehalfForm')) {
  const chkNewUser = document.getElementById('chkNewUser');
  const existingUserSection = document.getElementById('existingUserSection');
  const newUserSection = document.getElementById('newUserSection');
  const userSelect = document.getElementById('userSelect');
  const jenisSelect = document.getElementById('jenisSelect');
  const onBehalfForm = document.getElementById('onBehalfForm');

  if (userSelect) {
    userSelect.setAttribute('required', 'required');
  }

  // Toggle user sections
  chkNewUser.addEventListener('change', () => {
    if (chkNewUser.checked) {
      existingUserSection.classList.add('hidden');
      newUserSection.classList.remove('hidden');
      userSelect.removeAttribute('required');
      newUserSection.querySelectorAll('input, select, textarea').forEach(el => {
        if (el.name === 'nama' || el.name === 'nik') {
          el.setAttribute('required', 'required');
        }
      });
    } else {
      existingUserSection.classList.remove('hidden');
      newUserSection.classList.add('hidden');
      userSelect.setAttribute('required', 'required');
      newUserSection.querySelectorAll('input, select, textarea').forEach(el => {
        el.removeAttribute('required');
      });
    }
  });

  // Load Warga list
  async function loadWargaOptions() {
    showLoader();
    const r = await apiFetch('/users?role=warga', { method: 'GET' });
    hideLoader();
    if (r.success && r.data) {
      userSelect.innerHTML = '<option value="">-- Pilih Warga --</option>';
      r.data.forEach(user => {
        userSelect.insertAdjacentHTML('beforeend', `<option value="${user.id_user}">${user.nama} (${user.nik || 'Tidak ada NIK'})</option>`);
      });
    } else {
      showToast('Gagal memuat daftar warga');
    }
  }

  // Load Jenis Surat list
  async function loadJenisSuratOptionsForOnBehalf() {
    showLoader();
    const r = await apiFetch('/jenis-surat', { method: 'GET' });
    hideLoader();
    if (r.success && r.data) {
      window.allJenisSurat = r.data;
      jenisSelect.innerHTML = '<option value="">-- Pilih Jenis Surat --</option>';
      r.data.forEach(jenis => {
        jenisSelect.insertAdjacentHTML('beforeend', `<option value="${jenis.id_jenis}">${jenis.nama_jenis}</option>`);
      });

      // Bind change listener for dynamic fields
      jenisSelect.onchange = function() {
        handleJenisSuratChange(this);
      };
    } else {
      showToast('Gagal memuat jenis surat');
    }
  }

  // Initial loads
  loadWargaOptions();
  loadJenisSuratOptionsForOnBehalf();

  // Submit Handler
  onBehalfForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoader();

    const fd = new FormData(e.target);
    const formObj = Object.fromEntries(fd.entries());

    // Collect all dynamic fields if container is visible
    const dynamicBody = document.getElementById('dynamicFieldsBody');
    const dynamicContainer = document.getElementById('dynamicFieldsContainer');
    let keteranganValue = formObj.keterangan || '';

    if (dynamicContainer && !dynamicContainer.classList.contains('hidden') && dynamicBody) {
      const dynamicFieldsObj = {};
      dynamicBody.querySelectorAll('input, select, textarea').forEach(input => {
        dynamicFieldsObj[input.name] = input.value;
      });

      keteranganValue = JSON.stringify({
        is_dynamic: true,
        keterangan_tambahan: keteranganValue,
        fields: dynamicFieldsObj
      });
    }

    const isNewUser = chkNewUser.checked;
    
    // Construct body payload
    const body = {
      is_new_user: isNewUser,
      id_jenis: parseInt(formObj.id_jenis, 10),
      keperluan: formObj.keperluan,
      keterangan: keteranganValue
    };

    if (isNewUser) {
      body.new_user_data = {
        nama: formObj.nama,
        nik: formObj.nik,
        no_hp: formObj.no_hp || null,
        email: formObj.email || null,
        tempat_lahir: formObj.tempat_lahir || null,
        tanggal_lahir: formObj.tanggal_lahir || null,
        jenis_kelamin: formObj.jenis_kelamin || null,
        agama: formObj.agama || null,
        pekerjaan: formObj.pekerjaan || null,
        status_perkawinan: formObj.status_perkawinan || null,
        alamat: formObj.alamat || null
      };
    } else {
      body.id_user = parseInt(formObj.id_user, 10);
    }

    const r = await apiFetch('/pengajuan/on-behalf', {
      method: 'POST',
      body: body
    });

    hideLoader();

    if (r.success) {
      const id = r.data && r.data.id_pengajuan ? r.data.id_pengajuan : (r.data ? r.data.id : null);
      const fileEl = el('#fileInput');
      if (id && fileEl && fileEl.files && fileEl.files.length){
        const ffd = new FormData(); 
        for (let i = 0; i < fileEl.files.length; i++) {
          ffd.append('files', fileEl.files[i]);
        }
        const token = localStorage.getItem('token');
        await fetch(apiBase+`/pengajuan/${id}/upload`, {method:'POST', headers:{'Authorization':'Bearer '+token}, body:ffd});
      }
      showToast(r.message);
      setTimeout(() => {
        window.location.href = 'verifikasi.html';
      }, 1500);
    } else {
      showToast(r.message || 'Gagal membuat pengajuan surat');
    }
  });
}

// --- DAFTAR WARGA DIRECTORY LOGIC ---
let wargaListGlobal = [];
let filteredWargaList = [];
let currentPage = 1;
let pageSize = 10;

async function loadWargaList() {
  showLoader();
  const r = await apiFetch('/users?role=warga', { method: 'GET' });
  hideLoader();
  if (r.success && r.data) {
    wargaListGlobal = r.data;
    filteredWargaList = [...wargaListGlobal];
    currentPage = 1;
    renderWargaTable(filteredWargaList);
    setupPaginationEvents();
  } else {
    showToast('Gagal memuat daftar warga');
  }
}

function renderWargaTable(list) {
  const tbody = document.getElementById('wargaTableBody');
  if (!tbody) return;

  const totalEntries = list.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;

  if (currentPage > totalPages) currentPage = totalPages;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedList = list.slice(startIndex, endIndex);

  if (!list || list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-8 text-center text-gray-400">Tidak ada warga terdaftar</td></tr>';
    updatePaginationControls(0, 0, 0, 1);
    return;
  }

  tbody.innerHTML = '';
  paginatedList.forEach(warga => {
    const statusClass = warga.status === 'aktif' 
      ? 'bg-green-100 text-green-700 border border-green-200' 
      : 'bg-red-100 text-red-700 border border-red-200';
    const statusText = warga.status === 'aktif' ? 'Aktif' : 'Non-Aktif';

    const ttl = (warga.tempat_lahir || warga.tanggal_lahir)
      ? `${warga.tempat_lahir || '-'}, ${warga.tanggal_lahir ? new Date(warga.tanggal_lahir).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}) : '-'}`
      : '-';

    const rowHtml = `
      <tr class="hover:bg-gray-50/50 transition-colors">
        <td class="px-6 py-4">
          <div class="font-bold text-gray-800">${warga.nama}</div>
          <div class="text-xs text-gray-500 font-mono">${warga.nik || '-'}</div>
        </td>
        <td class="px-6 py-4 text-sm text-gray-600">${warga.email || '-'}</td>
        <td class="px-6 py-4 text-xs text-gray-600">
          <div>${ttl}</div>
          <div class="text-gray-400 font-medium">${warga.jenis_kelamin || '-'}</div>
        </td>
        <td class="px-6 py-4 text-xs text-gray-600">
          <div>${warga.agama || '-'}</div>
          <div class="text-gray-400 font-medium">${warga.pekerjaan || '-'}</div>
        </td>
        <td class="px-6 py-4 text-xs text-gray-600">${warga.status_perkawinan || '-'}</td>
        <td class="px-6 py-4 text-xs text-gray-600 max-w-xs truncate">${warga.alamat || '-'}</td>
        <td class="px-6 py-4">
          <span class="status-badge ${statusClass}">${statusText}</span>
        </td>
        <td class="px-6 py-4">
          <div class="flex items-center justify-center gap-2">
            <button onclick="openEditWargaModal(${warga.id_user})" class="btn-outline">
              <i class="fa-solid fa-user-pen"></i> Edit
            </button>
            <button onclick="triggerResetPassword(${warga.id_user})" class="btn-danger-outline">
              <i class="fa-solid fa-key"></i> Reset
            </button>
          </div>
        </td>
      </tr>
    `;
    tbody.insertAdjacentHTML('beforeend', rowHtml);
  });

  updatePaginationControls(startIndex + 1, endIndex, totalEntries, totalPages);
}

function updatePaginationControls(start, end, total, totalPages) {
  const info = document.getElementById('paginationInfo');
  const btnPrev = document.getElementById('btnPrevPage');
  const btnNext = document.getElementById('btnNextPage');

  if (info) {
    info.textContent = total > 0 
      ? `Menampilkan ${start} - ${end} dari ${total} warga` 
      : 'Menampilkan 0 - 0 dari 0 warga';
  }
  if (btnPrev) btnPrev.disabled = currentPage <= 1;
  if (btnNext) btnNext.disabled = currentPage >= totalPages;
}

function setupPaginationEvents() {
  const limitSelect = document.getElementById('entriesLimitSelect');
  const btnPrev = document.getElementById('btnPrevPage');
  const btnNext = document.getElementById('btnNextPage');

  if (limitSelect) {
    limitSelect.onchange = function() {
      pageSize = parseInt(this.value, 10);
      currentPage = 1;
      renderWargaTable(filteredWargaList);
    };
  }

  if (btnPrev) {
    btnPrev.onclick = function() {
      if (currentPage > 1) {
        currentPage--;
        renderWargaTable(filteredWargaList);
      }
    };
  }

  if (btnNext) {
    btnNext.onclick = function() {
      const totalPages = Math.ceil(filteredWargaList.length / pageSize) || 1;
      if (currentPage < totalPages) {
        currentPage++;
        renderWargaTable(filteredWargaList);
      }
    };
  }
}

// Live Search Filter
if (document.getElementById('wargaSearchInput')) {
  document.getElementById('wargaSearchInput').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      filteredWargaList = [...wargaListGlobal];
    } else {
      filteredWargaList = wargaListGlobal.filter(w => 
        (w.nama && w.nama.toLowerCase().includes(query)) || 
        (w.nik && w.nik.includes(query))
      );
    }
    currentPage = 1;
    renderWargaTable(filteredWargaList);
  });
}

// Edit Modal Opening & Setup
window.openEditWargaModal = function(id) {
  const warga = wargaListGlobal.find(w => w.id_user === id);
  if (!warga) return;

  const modal = document.getElementById('editWargaModal');
  const form = document.getElementById('editWargaForm');
  if (!modal || !form) return;

  // Populate values
  form.elements['id_user'].value = warga.id_user;
  form.elements['nama'].value = warga.nama || '';
  form.elements['nik'].value = warga.nik || '';
  form.elements['email'].value = warga.email || '';
  if (form.elements['no_hp']) form.elements['no_hp'].value = warga.no_hp || '';
  form.elements['status'].value = warga.status || 'aktif';
  form.elements['tempat_lahir'].value = warga.tempat_lahir || '';
  form.elements['tanggal_lahir'].value = warga.tanggal_lahir ? warga.tanggal_lahir.substring(0, 10) : '';
  form.elements['jenis_kelamin'].value = warga.jenis_kelamin || '';
  form.elements['agama'].value = warga.agama || '';
  form.elements['pekerjaan'].value = warga.pekerjaan || '';
  form.elements['status_perkawinan'].value = warga.status_perkawinan || '';
  form.elements['alamat'].value = warga.alamat || '';

  const ktpContainer = document.getElementById('editWargaKtpContainer');
  if (ktpContainer) {
    if (warga.foto_ktp) {
      const ktpUrl = warga.foto_ktp.startsWith('data:') ? warga.foto_ktp : `${serverBase}${warga.foto_ktp}`;
      ktpContainer.innerHTML = `
        <label class="block text-xs font-bold text-gray-500 mb-1">Dokumen KTP Warga</label>
        <div class="max-w-sm text-left">
          <a href="${ktpUrl}" target="_blank" class="block group relative rounded-xl overflow-hidden shadow border border-gray-200 bg-gray-100 aspect-[8.5/5.5]">
            <img src="${ktpUrl}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="KTP Warga" />
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold"><i class="fa-solid fa-magnifying-glass-plus mr-1"></i> Perbesar Foto KTP</div>
          </a>
        </div>
      `;
    } else {
      ktpContainer.innerHTML = `
        <label class="block text-xs font-bold text-gray-500 mb-1">Dokumen KTP Warga</label>
        <div class="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-700 text-xs flex items-center gap-2">
          <i class="fa-solid fa-triangle-exclamation text-amber-500"></i>
          <span>Warga ini belum mengunggah foto KTP pada akunnya.</span>
        </div>
      `;
    }
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
};

// Close Edit Modal
function closeEditWarga() {
  const modal = document.getElementById('editWargaModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}
if (document.getElementById('closeEditWargaModal')) {
  document.getElementById('closeEditWargaModal').addEventListener('click', closeEditWarga);
}
if (document.getElementById('btnCancelEditWarga')) {
  document.getElementById('btnCancelEditWarga').addEventListener('click', closeEditWarga);
}

// Submit Edit
if (document.getElementById('editWargaForm')) {
  document.getElementById('editWargaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoader();

    const fd = new FormData(e.target);
    const formObj = Object.fromEntries(fd.entries());
    const id = formObj.id_user;

    const r = await apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: formObj
    });
    hideLoader();

    if (r.success) {
      showToast(r.message);
      closeEditWarga();
      loadWargaList();
    } else {
      showToast(r.message || 'Gagal menyimpan perubahan');
    }
  });
}

// Reset Password Action (With Custom Prompt Modal)
window.triggerResetPassword = function(id) {
  const warga = wargaListGlobal.find(w => w.id_user === id);
  if (!warga) return;

  const promptModal = document.getElementById('resetPasswordPromptModal');
  const promptForm = document.getElementById('resetPasswordPromptForm');
  const wargaNameInput = document.getElementById('resetWargaName');
  const wargaPasswordInput = document.getElementById('resetWargaPasswordInput');

  if (!promptModal || !promptForm) return;

  // Generate suggested default password: First Name + last 3 digits of NIK
  const namaDepan = warga.nama.trim().split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const tigaDigitNIK = warga.nik.substring(Math.max(0, warga.nik.length - 3));
  const suggestedPassword = `${namaDepan}${tigaDigitNIK}`;

  promptForm.elements['id_user'].value = warga.id_user;
  wargaNameInput.value = warga.nama;
  wargaPasswordInput.value = suggestedPassword;

  promptModal.classList.remove('hidden');
  promptModal.classList.add('flex');
};

// Close Reset Password Prompt Modal
function closeResetPrompt() {
  const modal = document.getElementById('resetPasswordPromptModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}
if (document.getElementById('closeResetPromptModal')) {
  document.getElementById('closeResetPromptModal').addEventListener('click', closeResetPrompt);
}
if (document.getElementById('btnCancelResetPrompt')) {
  document.getElementById('btnCancelResetPrompt').addEventListener('click', closeResetPrompt);
}

// Submit Reset Password (Custom Password Input)
if (document.getElementById('resetPasswordPromptForm')) {
  document.getElementById('resetPasswordPromptForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    closeResetPrompt();
    showLoader();

    const fd = new FormData(e.target);
    const formObj = Object.fromEntries(fd.entries());
    const id = formObj.id_user;

    const r = await apiFetch(`/users/${id}/reset-password`, {
      method: 'POST',
      body: { password: formObj.password }
    });
    hideLoader();

    if (r.success && r.newPassword) {
      const modal = document.getElementById('resetPasswordModal');
      const display = document.getElementById('newPasswordDisplay');
      if (modal && display) {
        display.textContent = r.newPassword;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }
    } else {
      showToast(r.message || 'Gagal menyetel ulang kata sandi');
    }
  });
}

// Close Reset Password Result Modal
if (document.getElementById('btnConfirmResetClose')) {
  document.getElementById('btnConfirmResetClose').addEventListener('click', () => {
    const modal = document.getElementById('resetPasswordModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
    loadWargaList();
  });
}

// --- BUKU SURAT KELUAR LOGIC ---
let allSuratKeluar = [];

async function loadSuratKeluarList() {
  const container = el('#suratKeluarTableBody');
  if (!container) return;

  showLoader();
  const r = await apiFetch('/pengajuan?status=disetujui&limit=1000', { method: 'GET' });
  hideLoader();

  if (r.success && r.data) {
    allSuratKeluar = r.data;
    renderSuratKeluar(allSuratKeluar);
  } else {
    showToast('Gagal memuat buku surat keluar');
  }
}

function renderSuratKeluar(list) {
  const container = el('#suratKeluarTableBody');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-8 text-center text-gray-500 font-medium">
          <i class="fa-solid fa-folder-open text-2xl mb-2 block"></i> Tidak ada data surat keluar
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  list.forEach((item, index) => {
    const dateFormatted = new Date(item.tanggal_pengajuan).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Parse dynamic fields (keterangan)
    let detailsText = '-';
    if (item.keterangan) {
      try {
        const parsed = JSON.parse(item.keterangan);
        detailsText = Object.entries(parsed)
          .map(([k, v]) => `${k.replace('_', ' ')}: ${v}`)
          .join(', ');
      } catch (e) {
        detailsText = item.keterangan;
      }
    }

    html += `
      <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <td class="px-6 py-4 text-sm font-bold text-gray-700">${index + 1}</td>
        <td class="px-6 py-4 text-sm text-gray-600">${dateFormatted}</td>
        <td class="px-6 py-4 text-sm font-bold text-primary">${item.nomor_surat || '-'}</td>
        <td class="px-6 py-4 text-sm text-gray-700">
          <div class="font-bold">${item.nama_pemohon || 'Warga'}</div>
          <div class="text-xs text-gray-400">NIK: ${item.nik || '-'}</div>
        </td>
        <td class="px-6 py-4 text-sm text-gray-600">
          <span class="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold">${item.nama_jenis}</span>
        </td>
        <td class="px-6 py-4 text-xs text-gray-400 max-w-xs truncate" title="${detailsText}">${detailsText}</td>
        <td class="px-6 py-4 text-center">
          <button onclick="downloadPdf(${item.id_pengajuan})" class="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-all" title="Unduh Berkas PDF">
            <i class="fa-solid fa-file-arrow-down"></i>
          </button>
        </td>
      </tr>
    `;
  });
  container.innerHTML = html;
}

window.filterSuratKeluar = function() {
  const qNomor = el('#filterNomor').value.toLowerCase();
  const qWarga = el('#filterWarga').value.toLowerCase();
  const qJenis = el('#filterJenis').value.toLowerCase();
  const qTanggal = el('#filterTanggal').value;

  const filtered = allSuratKeluar.filter(item => {
    const dateStr = item.tanggal_pengajuan ? item.tanggal_pengajuan.split('T')[0] : '';
    
    const matchNomor = !qNomor || (item.nomor_surat && item.nomor_surat.toLowerCase().includes(qNomor));
    const matchWarga = !qWarga || (item.nama_pemohon && item.nama_pemohon.toLowerCase().includes(qWarga)) || (item.nik && item.nik.includes(qWarga));
    const matchJenis = !qJenis || (item.nama_jenis && item.nama_jenis.toLowerCase().includes(qJenis));
    const matchTanggal = !qTanggal || dateStr === qTanggal;

    return matchNomor && matchWarga && matchJenis && matchTanggal;
  });

  renderSuratKeluar(filtered);
};

// --- REAL-TIME SERVER-SENT EVENTS (SSE) ---
let realtimeEventSource = null;

function initRealtime() {
  const token = localStorage.getItem('token');
  if (!token) return;

  if (realtimeEventSource) {
    realtimeEventSource.close();
  }

  const realtimeUrl = `${apiBase}/realtime/stream?token=${token}`;
  console.log('[Realtime] Connecting to SSE stream:', realtimeUrl);
  
  realtimeEventSource = new EventSource(realtimeUrl);

  realtimeEventSource.addEventListener('new_pengajuan', (e) => {
    console.log('[Realtime] Received event: new_pengajuan', e.data);
    triggerRealtimeReloads();
  });

  realtimeEventSource.addEventListener('status_update', (e) => {
    console.log('[Realtime] Received event: status_update', e.data);
    triggerRealtimeReloads();
  });

  realtimeEventSource.onerror = (err) => {
    console.warn('[Realtime] SSE Connection error. Reconnecting in 5s...');
    realtimeEventSource.close();
    realtimeEventSource = null;
    setTimeout(initRealtime, 5000);
  };
}

function triggerRealtimeReloads() {
  const path = window.location.pathname.toLowerCase();
  
  if (path.includes('dashboard.html')) {
    console.log('[Realtime] Reloading dashboard stats silently...');
    loadDashboardStats();
  }
  
  if (path.includes('verifikasi.html')) {
    console.log('[Realtime] Reloading verification stats silently...');
    loadAdmin(currentAdminFilterStatus, true);
  }

  if (path.includes('riwayat.html')) {
    console.log('[Realtime] Reloading citizen requests silently...');
    loadMyPengajuan(true);
  }
}

// Force NIK inputs to only accept exactly 16 numeric digits
document.addEventListener('input', (e) => {
  if (e.target && e.target.name === 'nik') {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 16);
  }
});
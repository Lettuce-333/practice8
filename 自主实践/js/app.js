'use strict';
const STORE_KEY = 'myboard-books';
const data = {
  list: [],
  filter: { status: 'all', keyword: '' },
  charts: { bar: null, pie: null }
};
const STATUS_TEXT  = { wish: '想读', reading: '在读', done: '读完' };
const STATUS_CLASS = { wish: 'badge-secondary', reading: 'badge-primary', done: 'badge-success' };
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}
function saveLocal() {
  localStorage.setItem(STORE_KEY, JSON.stringify(data.list));
}
function showState(name) {
  $('#shelfLoading').toggleClass('d-none', name !== 'loading');
  $('#shelfError').toggleClass('d-none', name !== 'error');
  $('#shelfBody').toggleClass('d-none', name !== 'body');
}
async function loadBooks() {
  const saved = localStorage.getItem(STORE_KEY);
  if (saved) {
    try {
      data.list = JSON.parse(saved);
      showState('body');
      renderAll();
      return;
    } catch (e) { localStorage.removeItem(STORE_KEY); }
  }
  showState('loading');
  try {
    const res = await fetch('data/books.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const list = await res.json();
    if (!Array.isArray(list) || list.length === 0) {
      $('#bookList').html('<div class="col-12"><div class="alert alert-warning mb-0">暂无书目数据。</div></div>');
      showState('body');
      return;
    }
    data.list = list;
    saveLocal();
    showState('body');
    renderAll();
  } catch (err) {
    console.error('书目加载失败：', err);
    showState('error');
  }
}
function renderBooks() {
  const kw = data.filter.keyword.trim().toLowerCase();
  const list = data.list.filter(b =>
    (data.filter.status === 'all' || b.status === data.filter.status) &&
    (!kw || b.title.toLowerCase().includes(kw) || b.author.toLowerCase().includes(kw))
  );
  $('#bookCount').text('共 ' + list.length + ' 本');
  if (data.list.length === 0) {
    $('#bookList').html('<div class="col-12"><div class="alert alert-info mb-0">书架空空如也，用上方表单添加第一本书吧。</div></div>');
    return;
  }
  const html = list.map(b => `
    <div class="col-12 col-md-6 col-lg-4 mb-3">
      <div class="card h-100 shadow-sm">
        <div class="card-body">
          <h5 class="card-title">${escapeHtml(b.title)}</h5>
          <h6 class="card-subtitle mb-2 text-muted">${escapeHtml(b.author)} · ${escapeHtml(b.category)}</h6>
          <span class="badge ${STATUS_CLASS[b.status] || 'badge-light'}">${STATUS_TEXT[b.status] || '未知'}</span>
          ${b.status === 'done' && b.month !== '' ? `<span class="badge badge-light">${escapeHtml(b.month)} 月读完</span>` : ''}
        </div>
        <div class="card-footer bg-transparent">
          ${b.status !== 'done' ? `<button class="btn btn-sm btn-outline-success mr-1" data-action="done" data-id="${b.id}">标记读完</button>` : ''}
          <button class="btn btn-sm btn-outline-danger" data-action="del" data-id="${b.id}">删除</button>
        </div>
      </div>
    </div>`).join('');
  $('#bookList').html(html || '<div class="col-12"><div class="alert alert-warning mb-0">没有符合条件的书。</div></div>');
}
function renderCharts() {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const monthCounts = months.map(m =>
    data.list.filter(b => b.status === 'done' && Number(b.month) === m).length
  );
  if (!data.charts.bar) data.charts.bar = echarts.init(document.getElementById('chartMonth'));
  data.charts.bar.setOption({
    title: { text: '各月读完数量（单位：本）', subtext: '数据来源：data/books.json 与本地操作记录', left: 'center' },
    tooltip: { trigger: 'axis' },
    grid: { top: 80, left: 40, right: 20, bottom: 40 },
    xAxis: { type: 'category', data: months.map(m => m + '月') },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{ name: '读完', type: 'bar', data: monthCounts, itemStyle: { color: '#5470c6' } }]
  });
  const byCat = {};
  data.list.forEach(b => { byCat[b.category] = (byCat[b.category] || 0) + 1; });
  if (!data.charts.pie) data.charts.pie = echarts.init(document.getElementById('chartCategory'));
  data.charts.pie.setOption({
    title: { text: '书架分类占比', subtext: '数据来源：同上', left: 'center' },
    tooltip: { trigger: 'item', formatter: '{b}：{c} 本（{d}%）' },
    legend: { bottom: 0 },
    series: [{ type: 'pie', radius: ['35%', '65%'], data: Object.keys(byCat).map(k => ({ name: k, value: byCat[k] })) }]
  });
}
function renderAll() {
  renderBooks();
  renderCharts();
}
function bindEvents() {
  $('#addForm').on('submit', function (e) {
    e.preventDefault();
    const title = $('#bookTitle').val().trim();
    if (!title) { $('#formHint').text('书名不能为空'); return; }
    $('#formHint').text('');
    data.list.unshift({
      id: Date.now(),
      title: title.slice(0, 50),
      author: $('#bookAuthor').val().trim().slice(0, 30) || '佚名',
      category: $('#bookCategory').val(),
      status: $('#bookStatus').val(),
      month: ''
    });
    saveLocal();
    renderAll();
    this.reset();
  });
  $('#bookList').on('click', '[data-action]', function () {
    const id = Number($(this).data('id'));
    if ($(this).data('action') === 'del') {
      data.list = data.list.filter(b => b.id !== id);
    } else {
      const book = data.list.find(b => b.id === id);
      if (book) { book.status = 'done'; book.month = new Date().getMonth() + 1; }
    }
    saveLocal();
    renderAll();
  });
  $('#statusFilter').on('change', function () { data.filter.status = $(this).val(); renderBooks(); });
  $('#searchInput').on('input', function () { data.filter.keyword = $(this).val(); renderBooks(); });
  $('#retryBtn').on('click', loadBooks);
  $(window).on('resize', () => {
    data.charts.bar && data.charts.bar.resize();
    data.charts.pie && data.charts.pie.resize();
  });
}
$(function () {
  bindEvents();
  loadBooks();
});
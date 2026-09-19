'use strict';
const ROOMS = [
  { name: '一教 101 自习室',floor: 1,open: true,seats: 60 },
  { name: '一教 201 自习室',floor: 2,open: false,seats: 50 },
  { name: '图书馆三楼自习区',floor: 3,open: true,seats: 120 },
  { name: '图书馆四楼研讨区',floor: 4,open: true,seats: 40 },
  { name: '二教 105 自习室',floor: 1,open: true,seats: 80 },
  { name: '二教 305 自习室',floor: 3,open: false,seats: 45 }
];
const roomFilter = { floor: 'all', open: 'all' };
let statsChart = null;
function renderRooms() {
  const list = ROOMS.filter(r =>
    (roomFilter.floor === 'all' || r.floor === Number(roomFilter.floor)) &&
    (roomFilter.open === 'all' || r.open === (roomFilter.open === 'open'))
  );
  $('#roomCount').text('共 ' + list.length + ' 间符合条件');
  $('#roomList').html(list.map(r => `
    <div class="col-12 col-md-6 col-lg-4 mb-3">
      <div class="card h-100 shadow-sm">
        <div class="card-body">
          <h5 class="card-title">${r.name}</h5>
          <p class="card-text mb-1">楼层：${r.floor} 楼</p>
          <p class="card-text">座位：${r.seats} 个</p>
          <span class="badge ${r.open ? 'badge-success' : 'badge-secondary'}">
            ${r.open ? '开放中' : '已关闭'}
          </span>
        </div>
      </div>
    </div>`).join(''));
}
function renderChart(list) {
  const dom = document.getElementById('statsChart');
  if (!statsChart) statsChart = echarts.init(dom);
  statsChart.setOption({
    title: {
      text: '各自习室使用量（单位：人次）',
      subtext: '数据来源：data/data.json（课程示例数据）',
      left: 'center'
    },
    tooltip: { trigger: 'axis' },
    grid: { top: 80, left: 50, right: 30, bottom: 40 },
    xAxis: {
      type: 'category',
      data: list.map(item => item.name),
      axisLabel: { interval: 0 }
    },
    yAxis: { type: 'value', name: '人次' },
    series: [{
      name: '使用量',
      type: 'bar',
      data: list.map(item => item.used),
      itemStyle: { color: '#5470c6' }
    }]
  });
}
async function loadStats() {
  $('#statsLoading').removeClass('d-none');
  $('#statsError, #statsEmpty, #statsChart').addClass('d-none');
  try {
    const res = await fetch('data/data.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const list = await res.json();
    if (!Array.isArray(list) || list.length === 0) {
      $('#statsEmpty').removeClass('d-none');
      return;
    }
    $('#statsChart').removeClass('d-none');
    renderChart(list);
  } catch (err) {
    console.error('统计数据加载失败：', err);
    $('#statsError').removeClass('d-none');
  } finally {
    $('#statsLoading').addClass('d-none');
  }
}
function bindEvents() {
  $('#floorFilter, #openFilter').on('change', function () {
    roomFilter[this.id === 'floorFilter' ? 'floor' : 'open'] = $(this).val();
    renderRooms();
  });
  $('#statsRetry').on('click', loadStats);
  $(window).on('resize', () => statsChart && statsChart.resize());
}
$(function () {
  renderRooms();
  bindEvents();
  loadStats();
});
/* ==========================================================================
   EDUCARRUS — ADMIN DASHBOARD & LEAD MANAGEMENT CONTROLLER
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initial Mock Student Leads Data
  const defaultLeads = [
    {
      id: 'ED-8091',
      name: 'Aarav Sharma',
      course: 'MBBS (Medical)',
      score: '580 (NEET UG)',
      location: 'Lucknow, UP',
      date: '2026-08-20 11:42 AM',
      counsellor: 'Rajiv Kumar',
      status: 'counselling',
      phone: '+91 98765 12345'
    },
    {
      id: 'ED-8092',
      name: 'Ananya Verma',
      course: 'B.Tech (Computer Science)',
      score: '94.2 (JEE Main)',
      location: 'Delhi NCR',
      date: '2026-08-20 10:15 AM',
      counsellor: 'Amit Deshmukh',
      status: 'new',
      phone: '+91 98123 45678'
    },
    {
      id: 'ED-8093',
      name: 'Rohan Patel',
      course: 'BAMS (Ayurveda)',
      score: '490 (NEET UG)',
      location: 'Ahmedabad, GJ',
      date: '2026-08-19 04:30 PM',
      counsellor: 'Sunita Rao',
      status: 'converted',
      phone: '+91 97654 32109'
    },
    {
      id: 'ED-8094',
      name: 'Priya Nair',
      course: 'BDS (Dental)',
      score: '515 (NEET UG)',
      location: 'Kochi, KL',
      date: '2026-08-19 02:10 PM',
      counsellor: 'Rajiv Kumar',
      status: 'counselling',
      phone: '+91 98450 98765'
    },
    {
      id: 'ED-8095',
      name: 'Karan Malhotra',
      course: 'B.Pharm (Pharmacy)',
      score: '88.5% (Class 12th)',
      location: 'Jaipur, RJ',
      date: '2026-08-19 11:05 AM',
      counsellor: 'Sunita Rao',
      status: 'new',
      phone: '+91 99887 66554'
    },
    {
      id: 'ED-8096',
      name: 'Meera Deshmukh',
      course: 'MBBS (Private / Management)',
      score: '450 (NEET UG)',
      location: 'Pune, MH',
      date: '2026-08-18 06:15 PM',
      counsellor: 'Rajiv Kumar',
      status: 'converted',
      phone: '+91 91234 56789'
    }
  ];

  // Load stored leads or merge defaults
  function getLeads() {
    const stored = localStorage.getItem('educarrus_leads');
    if (!stored) {
      localStorage.setItem('educarrus_leads', JSON.stringify(defaultLeads));
      return defaultLeads;
    }
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultLeads;
    } catch (e) {
      return defaultLeads;
    }
  }

  let currentLeads = getLeads();
  let currentFilter = 'all';

  const leadTableBody = document.getElementById('leadTableBody');
  const searchInput = document.getElementById('leadSearchInput');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const kpiTotalLeads = document.getElementById('kpiTotalLeads');

  // Render Table
  function renderLeads(leadsToRender) {
    if (!leadTableBody) return;

    if (leadsToRender.length === 0) {
      leadTableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">
            <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 8px; display: block;"></i>
            No student leads found matching your criteria.
          </td>
        </tr>
      `;
      return;
    }

    leadTableBody.innerHTML = leadsToRender.map(lead => {
      let statusBadge = '';
      if (lead.status === 'new') {
        statusBadge = `<span class="status-badge status-new"><i class="fa-solid fa-circle-dot"></i> New Inquiry</span>`;
      } else if (lead.status === 'counselling') {
        statusBadge = `<span class="status-badge status-counselling"><i class="fa-solid fa-headset"></i> In Counselling</span>`;
      } else if (lead.status === 'converted') {
        statusBadge = `<span class="status-badge status-converted"><i class="fa-solid fa-check-double"></i> Converted</span>`;
      }

      const waCleanPhone = (lead.phone || '').replace(/[^0-9]/g, '');

      return `
        <tr>
          <td>
            <strong>${lead.name}</strong>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${lead.id || 'ED-LIVE'}</div>
          </td>
          <td>
            <span style="font-weight: 600; color: var(--primary-navy);">${lead.course}</span>
          </td>
          <td>${lead.score}</td>
          <td>${lead.location}</td>
          <td style="font-size: 0.82rem; color: var(--text-muted);">${lead.date}</td>
          <td>
            <span style="font-size: 0.85rem; font-weight: 600;">${lead.counsellor}</span>
          </td>
          <td>${statusBadge}</td>
          <td>
            <div style="display: flex; gap: 6px;">
              <a href="tel:${waCleanPhone}" class="action-btn-sm action-btn-call" title="Call Candidate">
                <i class="fa-solid fa-phone"></i> Call
              </a>
              <a href="https://wa.me/${waCleanPhone}?text=Hi%20${encodeURIComponent(lead.name)}%2C%20this%20is%20Educarrus%20Admission%20Desk%20regarding%20your%20${encodeURIComponent(lead.course)}%20enquiry." target="_blank" class="action-btn-sm action-btn-wa" title="WhatsApp Candidate">
                <i class="fa-brands fa-whatsapp"></i> Chat
              </a>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (kpiTotalLeads) {
      kpiTotalLeads.innerText = (1240 + currentLeads.length).toLocaleString();
    }
  }

  // Filter Function
  function filterLeads() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const filtered = currentLeads.filter(lead => {
      const matchesFilter = (currentFilter === 'all') || (lead.status === currentFilter);
      const matchesQuery = !query || 
        lead.name.toLowerCase().includes(query) ||
        lead.course.toLowerCase().includes(query) ||
        lead.location.toLowerCase().includes(query) ||
        (lead.phone && lead.phone.includes(query));

      return matchesFilter && matchesQuery;
    });

    renderLeads(filtered);
  }

  // Filter Buttons Click
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter') || 'all';
      filterLeads();
    });
  });

  // Search Input
  if (searchInput) {
    searchInput.addEventListener('input', filterLeads);
  }

  // Add Manual Lead
  const addNewLeadBtn = document.getElementById('addNewLeadBtn');
  if (addNewLeadBtn) {
    addNewLeadBtn.addEventListener('click', () => {
      const name = prompt('Enter Student Full Name:');
      if (!name) return;
      const course = prompt('Enter Course Interested (e.g. MBBS, B.Tech):') || 'General Counselling';
      const score = prompt('Enter NEET/JEE Score or Percentage:') || 'Class 12th';
      const location = prompt('Enter Student Location (City, State):') || 'India';
      const phone = prompt('Enter Phone Number:') || '+91 98765 43210';

      const newLead = {
        id: 'ED-' + Math.floor(1000 + Math.random() * 9000),
        name: name,
        course: course,
        score: score,
        location: location,
        date: new Date().toLocaleString(),
        counsellor: 'Rajiv Kumar',
        status: 'new',
        phone: phone
      };

      currentLeads.unshift(newLead);
      localStorage.setItem('educarrus_leads', JSON.stringify(currentLeads));
      filterLeads();
      alert(`Lead for ${name} added successfully to Educarrus Admin Database!`);
    });
  }

  // Export CSV
  const exportLeadsBtn = document.getElementById('exportLeadsBtn');
  if (exportLeadsBtn) {
    exportLeadsBtn.addEventListener('click', () => {
      let csvContent = "data:text/csv;charset=utf-8,ID,Name,Course,Score,Location,Date,Counsellor,Status,Phone\n";
      currentLeads.forEach(l => {
        csvContent += `"${l.id}","${l.name}","${l.course}","${l.score}","${l.location}","${l.date}","${l.counsellor}","${l.status}","${l.phone}"\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `educarrus_leads_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  // Initial Render
  filterLeads();
});

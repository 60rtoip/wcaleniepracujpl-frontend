import React from 'react'

export default function Home({user}){
  const role = user?.role || 'guest'

  const roleInfo = {
    guest: {
      title: 'Welcome',
      points: [
        'You can browse approved public jobs.',
        'Create an account to apply as a candidate or manage jobs as a recruiter.',
      ],
    },
    candidate: {
      title: 'Candidate dashboard',
      points: [
        'Browse approved public jobs and apply to matching offers.',
        'Track your application flow and status updates.',
      ],
    },
    recruiter: {
      title: 'Recruiter dashboard',
      points: [
        'Manage your companies, jobs, and applications from the recruiter dashboard.',
        'Add recruiter members and update application statuses for your job scope.',
      ],
    },
    admin: {
      title: 'Admin dashboard',
      points: [
        'Open the admin dashboard to review reports, updates, and account requests.',
        'Approve or reject recruiter applications and keep an eye on the live update feed.',
      ],
    },
  }

  const info = roleInfo[role] || roleInfo.guest

  return (
    <div>
      <h1>Job Board — Demo Frontend</h1>
      <p>This UI adapts to your account role.</p>

      <section className="role-panel">
        <h2>{info.title}</h2>
        <ul>
          {info.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}

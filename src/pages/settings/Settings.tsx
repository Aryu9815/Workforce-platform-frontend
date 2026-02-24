import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Shield, UserCog, Building, Bell, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

const Settings: React.FC = () => {
  const settingsOptions = [
    {
      title: 'Roles & Permissions',
      description: 'Define access levels and manage user permissions.',
      icon: Shield,
      href: '/settings/roles',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'General Settings',
      description: 'Manage your organization name, logo, and basic info.',
      icon: Building,
      href: '/settings/general',
      color: 'text-teal-500',
      bgColor: 'bg-teal-50'
    },
    {
      title: 'User Management',
      description: 'Invite and manage team members and their roles.',
      icon: UserCog,
      href: '/staff',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Notifications',
      description: 'Configure how and when you receive alerts.',
      icon: Bell,
      href: '/settings/notifications',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Security',
      description: 'Manage password policies and two-factor authentication.',
      icon: Lock,
      href: '/settings/security',
      color: 'text-red-500',
      bgColor: 'bg-red-50'
    }
  ]

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure and manage your organization's workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsOptions.map((option) => (
          <Link key={option.title} to={option.href}>
            <Card className="hover:border-primary transition-all hover:shadow-md h-full group">
              <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                <div className={`p-2 rounded-lg ${option.bgColor} ${option.color} group-hover:scale-110 transition-transform`}>
                  <option.icon className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">{option.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {option.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Settings

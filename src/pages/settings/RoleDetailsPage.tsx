import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Trash2, Edit, Loader2, Shield, HelpCircle } from 'lucide-react'
import { rolesApi } from '../../api/rolesApi'
import { RoleDetail, Permission, UpdateRoleRequest } from '../../types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Checkbox } from '../../components/ui/checkbox'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { toast } from 'react-hot-toast'
import { Badge } from '../../components/ui/Badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/Dialog'

const RoleDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [role, setRole] = useState<RoleDetail | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editRole, setEditRole] = useState({ name: '', description: '', is_default: false })

  useEffect(() => {
    if (id) {
      fetchData()
    }
  }, [id])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [roleData, permissionsData] = await Promise.all([
        rolesApi.get(id!),
        rolesApi.listPermissions()
      ])
      setRole(roleData)
      setPermissions(permissionsData)
      setSelectedPermissions(roleData.permissions || [])
      setEditRole({
        name: roleData.name,
        description: roleData.description || '',
        is_default: roleData.is_default || false
      })
    } catch (error) {
      console.error('Failed to fetch role details:', error)
      toast.error('Failed to load role details.')
      navigate('/settings/roles')
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    )
  }

  const handleSavePermissions = async () => {
    try {
      setIsSaving(true)
      await rolesApi.update(id!, { permissions: selectedPermissions })
      toast.success('Permissions updated successfully.')
      fetchData()
    } catch (error) {
      console.error('Failed to update permissions:', error)
      toast.error('Failed to update permissions.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditRole = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSaving(true)
      await rolesApi.update(id!, editRole)
      toast.success('Role updated successfully.')
      setIsEditModalOpen(false)
      fetchData()
    } catch (error) {
      console.error('Failed to update role:', error)
      toast.error('Failed to update role.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteRole = async () => {
    try {
      setIsDeleting(true)
      await rolesApi.delete(id!)
      toast.success('Role deleted successfully.')
      navigate('/settings/roles')
    } catch (error) {
      console.error('Failed to delete role:', error)
      toast.error('Failed to delete role.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc, curr) => {
    if (!acc[curr.resource]) {
      acc[curr.resource] = []
    }
    acc[curr.resource].push(curr)
    return acc
  }, {} as Record<string, Permission[]>)

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!role) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings/roles')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{role.name}</h1>
            {role.is_system && (
              <Badge variant="secondary" className="text-[10px] uppercase">System</Badge>
            )}
            {role.is_default && (
              <Badge variant="outline" className="text-[10px] uppercase border-teal-500 text-teal-500">Default</Badge>
            )}
          </div>
          <p className="text-muted-foreground">{role.description || 'No description provided.'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Edit Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Role</DialogTitle>
                <DialogDescription>
                  Update the role name and description.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditRole} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Role Name</Label>
                  <Input
                    id="edit-name"
                    value={editRole.name}
                    onChange={(e) => setEditRole({ ...editRole, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editRole.description}
                    onChange={(e) => setEditRole({ ...editRole, description: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-is_default"
                    checked={editRole.is_default}
                    onCheckedChange={(checked) => setEditRole({ ...editRole, is_default: checked as boolean })}
                  />
                  <Label htmlFor="edit-is_default">Set as default role</Label>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {!role.is_system && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete the role <strong>{role.name}</strong>.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive" onClick={handleDeleteRole} disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Delete Role
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>Select the permissions assigned to this role.</CardDescription>
            </div>
            <Button onClick={handleSavePermissions} disabled={isSaving} className="flex items-center gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Permissions
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <TooltipProvider>
            {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => (
              <div key={resource} className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {resource}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border rounded-lg p-4 bg-muted/20">
                  {resourcePermissions.map((perm) => (
                    <div key={perm.id} className="flex items-center space-x-3 group">
                      <Checkbox
                        id={perm.id}
                        checked={selectedPermissions.includes(perm.id)}
                        onCheckedChange={() => handleTogglePermission(perm.id)}
                      />
                      <div className="flex items-center gap-1.5">
                        <Label
                          htmlFor={perm.id}
                          className="text-sm font-medium leading-none cursor-pointer group-hover:text-primary transition-colors"
                        >
                          {perm.name}
                        </Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="max-w-xs">{perm.description || 'No description available'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </TooltipProvider>
        </CardContent>
        <CardFooter className="flex justify-end border-t pt-6">
          <Button onClick={handleSavePermissions} disabled={isSaving} className="flex items-center gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Permissions
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default RoleDetailsPage

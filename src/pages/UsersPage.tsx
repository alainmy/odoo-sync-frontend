import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Shield, ShieldOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getUsers, createUser, updateUser, deleteUser, User, UserCreate } from '@/services/userService';

interface FormData {
  username: string;
  email: string;
  password: string;
  full_name: string;
  changed_password: string;
  is_superuser: boolean;
}

const emptyForm: FormData = {
  username: '',
  email: '',
  password: '',
  full_name: '',
  changed_password: '',
  is_superuser: false,
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar los usuarios', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingUser(null);
  };

  const openNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      username: user.username,
      email: user.email,
      password: '',
      full_name: user.full_name,
      changed_password: '',
      is_superuser: user.is_superuser,

    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id,
          {
            username: form.username,
            email: form.email,
            changed_password: form.changed_password,
            full_name: form.full_name,
          });
        toast({ title: 'Éxito', description: 'User updated successfully' });
      } else {
        const payload: UserCreate = {
          username: form.username,
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          is_superuser: form.is_superuser,
        };
        await createUser(payload);
        toast({ title: 'Éxito', description: 'User created successfully' });
      }
      setDialogOpen(false);
      resetForm();
      loadUsers();
    } catch (error) {
      console.error('Error al crear el usuario', error);
      const { response: { data: { detail } } } = error as any;
      toast({ title: 'Error', description: `Error creating  user. ${detail}`, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`¿Do you really want to delete the user "${user.username}"?`)) return;
    try {
      await deleteUser(user.id);
      toast({ title: 'Éxito', description: 'User deleted successfully' });
      loadUsers();
    } catch {
      toast({ title: 'Error', description: 'Error deleting user', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-2">
            Manage users
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          New User
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre Completo</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
            )}
            {editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password">Change Password</Label>
                <Input
                  id="changed_password"
                  type="password"
                  value={form.changed_password}
                  onChange={(e) => setForm({ ...form, changed_password: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_superuser"
                checked={form.is_superuser}
                onCheckedChange={(checked) => setForm({ ...form, is_superuser: checked as boolean })}
              />
              <Label htmlFor="is_superuser" className="cursor-pointer">
                Superuser
              </Label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setDialogOpen(false); resetForm(); }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {editingUser ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Users List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No users registered</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-xs">{user.id}</TableCell>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.full_name || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.is_superuser ? (
                        <Badge variant="outline" className="gap-1">
                          <Shield className="h-3 w-3" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <ShieldOff className="h-3 w-3" />
                          User
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => openEdit(user)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(user)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

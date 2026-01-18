import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import StudentLayout from '@/components/layouts/StudentLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { User, Mail, GraduationCap, Building, BookOpen, Save, Loader2 } from 'lucide-react';

const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];

const courses = [
  'B.Tech Computer Science',
  'B.Tech Information Technology',
  'B.Tech Electronics',
  'B.Tech Mechanical',
  'B.Tech Civil',
  'B.Tech Electrical',
  'BCA',
  'MCA',
  'B.Sc Computer Science',
  'B.Sc IT',
  'BBA',
  'MBA',
  'Other',
];

interface ProfileFormData {
  name: string;
  college: string;
  course: string;
  semester: string;
}

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    college: '',
    course: '',
    semester: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        college: profile.college || '',
        course: profile.course || '',
        semester: profile.semester || '',
      });
    }
  }, [profile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name.trim(),
          college: formData.college.trim() || null,
          course: formData.course || null,
          semester: formData.semester || null,
        })
        .eq('id', user?.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account information</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        value={profile?.email || ''}
                        disabled
                        className="pl-10 bg-muted"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter your full name"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="college">College / University</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="college"
                        value={formData.college}
                        onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                        placeholder="Enter your college name"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="course">Course</Label>
                      <Select
                        value={formData.course || 'none'}
                        onValueChange={(value) => setFormData({ ...formData, course: value === 'none' ? '' : value })}
                      >
                        <SelectTrigger>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Select course" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select course</SelectItem>
                          {courses.map((course) => (
                            <SelectItem key={course} value={course}>
                              {course}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="semester">Semester</Label>
                      <Select
                        value={formData.semester || 'none'}
                        onValueChange={(value) => setFormData({ ...formData, semester: value === 'none' ? '' : value })}
                      >
                        <SelectTrigger>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Select semester" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select semester</SelectItem>
                          {semesters.map((sem) => (
                            <SelectItem key={sem} value={sem}>
                              Semester {sem}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving} className="gap-2">
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Profile Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Preview</CardTitle>
              <CardDescription>How others see your profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  {formData.name || 'Your Name'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {profile?.email}
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                {formData.college && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{formData.college}</span>
                  </div>
                )}
                {formData.course && (
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{formData.course}</span>
                  </div>
                )}
                {formData.semester && (
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span>Semester {formData.semester}</span>
                  </div>
                )}
                {!formData.college && !formData.course && !formData.semester && (
                  <p className="text-sm text-muted-foreground text-center">
                    Add your academic details to complete your profile
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentLayout>
  );
}

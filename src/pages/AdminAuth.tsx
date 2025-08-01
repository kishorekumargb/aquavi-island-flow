import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';

interface AdminAuthProps {
  onLogin: () => void;
}

export function AdminAuth({ onLogin }: AdminAuthProps) {
  const [userCredentials, setUserCredentials] = useState({ email: '', password: '', displayName: '' });
  const [adminCredentials, setAdminCredentials] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const { toast } = useToast();
  const { signIn, signUp } = useAuth();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(adminCredentials.email, adminCredentials.password);
      
      if (error) throw error;

      // Check if user has admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (roleData?.role === 'admin') {
        onLogin();
        toast({
          title: "Login Successful",
          description: "Welcome to Aqua VI Admin Dashboard",
        });
      } else {
        await supabase.auth.signOut();
        throw new Error('Access denied: Admin privileges required');
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials or insufficient privileges",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(userCredentials.email, userCredentials.password);
      
      if (error) throw error;

      toast({
        title: "Login Successful",
        description: "Welcome to Aqua VI!",
      });

      // Redirect to main page for regular users
      window.location.href = '/';
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', userCredentials.email);

      // Try to sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: userCredentials.email,
        password: userCredentials.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            display_name: userCredentials.displayName,
          }
        }
      });
      
      if (signUpError) {
        // Handle specific error messages
        if (signUpError.message.includes('already been registered')) {
          throw new Error('An account with this email already exists. Please try logging in instead.');
        }
        throw signUpError;
      }

      // Send welcome email only if signup was successful
      if (data.user && !data.user.identities?.length) {
        throw new Error('An account with this email already exists. Please try logging in instead.');
      }

      await sendWelcomeEmail(userCredentials.email, userCredentials.displayName, 'user');

      toast({
        title: "Account Created Successfully",
        description: `Welcome to Aqua VI! Check your email for a confirmation link.`,
      });

      setUserCredentials({ email: '', password: '', displayName: '' });
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Send welcome email after user creation
  const sendWelcomeEmail = async (email: string, displayName: string, role: string) => {
    try {
      await supabase.functions.invoke('send-welcome-email', {
        body: { email, displayName, role }
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-heading">Aqua VI</CardTitle>
          <CardDescription>Access your account or sign up to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="user" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="user">User Login</TabsTrigger>
              <TabsTrigger value="admin">Admin Login</TabsTrigger>
            </TabsList>
            
            <TabsContent value="user">
              <div id="login-form">
                <form onSubmit={handleUserLogin} className="space-y-4">
                <div>
                  <Label htmlFor="user-email">Email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={userCredentials.email}
                    onChange={(e) => setUserCredentials(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="user-password">Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="user-password"
                      type={showPassword ? 'text' : 'password'}
                      value={userCredentials.password}
                      onChange={(e) => setUserCredentials(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
                
                <div className="text-center mt-4 space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:underline block mx-auto"
                  >
                    Forgot your password?
                  </button>
                  <div className="text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-primary"
                      onClick={() => {
                        // Show signup form
                        const signupForm = document.getElementById('signup-form');
                        const loginForm = document.getElementById('login-form');
                        if (signupForm && loginForm) {
                          loginForm.style.display = 'none';
                          signupForm.style.display = 'block';
                        }
                      }}
                    >
                      Sign up
                    </Button>
                  </div>
                </div>
              </form>
              </div>

              {/* Signup Form */}
              <div id="signup-form" style={{ display: 'none' }}>
                <form onSubmit={handleUserSignup} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={userCredentials.displayName}
                      onChange={(e) => setUserCredentials(prev => ({ ...prev, displayName: e.target.value }))}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={userCredentials.email}
                      onChange={(e) => setUserCredentials(prev => ({ ...prev, email: e.target.value }))}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        value={userCredentials.password}
                        onChange={(e) => setUserCredentials(prev => ({ ...prev, password: e.target.value }))}
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Sign Up'}
                  </Button>
                  
                  <div className="text-center mt-4">
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-primary text-sm"
                      onClick={() => {
                        // Show login form
                        const signupForm = document.getElementById('signup-form');
                        const loginForm = document.getElementById('login-form');
                        if (signupForm && loginForm) {
                          signupForm.style.display = 'none';
                          loginForm.style.display = 'block';
                        }
                      }}
                    >
                      Already have an account? Sign in
                    </Button>
                  </div>
                </form>
              </div>
            </TabsContent>
            
            <TabsContent value="admin">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={adminCredentials.email}
                    onChange={(e) => setAdminCredentials(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="admin-password">Admin Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      value={adminCredentials.password}
                      onChange={(e) => setAdminCredentials(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Admin Sign In'}
                </Button>
                
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot your password?
                  </button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <ForgotPasswordModal 
        isOpen={showForgotPassword} 
        onClose={() => setShowForgotPassword(false)} 
      />
    </div>
  );
}
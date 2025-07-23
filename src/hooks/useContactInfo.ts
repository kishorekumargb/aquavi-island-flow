import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  deliveryHours: string;
  businessHoursMonFri: string;
  businessHoursSat: string;
  businessHoursSun: string;
}

const defaultContactInfo: ContactInfo = {
  phone: '1-499-4611',
  email: 'info@aquavi.com',
  address: 'MoneyGram, Flemming Street, Road Town, Tortola',
  deliveryHours: '3:30 PM - 5:30 PM',
  businessHoursMonFri: '8:00 AM - 6:00 PM',
  businessHoursSat: '9:00 AM - 4:00 PM',
  businessHoursSun: 'Emergency Only'
};

export function useContactInfo() {
  const [contactInfo, setContactInfo] = useState<ContactInfo>(defaultContactInfo);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'phone',
          'email', 
          'address',
          'delivery_hours',
          'business_hours_monday_friday',
          'business_hours_saturday',
          'business_hours_sunday'
        ]);

      if (error) {
        console.error('Supabase error:', error);
        // Use default values if there's an error
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const settings = data.reduce((acc, setting) => {
          acc[setting.setting_key] = setting.setting_value;
          return acc;
        }, {} as Record<string, string>);

        setContactInfo({
          phone: settings.phone || defaultContactInfo.phone,
          email: settings.email || defaultContactInfo.email,
          address: settings.address || defaultContactInfo.address,
          deliveryHours: settings.delivery_hours || defaultContactInfo.deliveryHours,
          businessHoursMonFri: settings.business_hours_monday_friday || defaultContactInfo.businessHoursMonFri,
          businessHoursSat: settings.business_hours_saturday || defaultContactInfo.businessHoursSat,
          businessHoursSun: settings.business_hours_sunday || defaultContactInfo.businessHoursSun
        });
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
      // Use default values if there's an error
    } finally {
      setLoading(false);
    }
  };

  return { contactInfo, loading, refetch: fetchContactInfo };
}
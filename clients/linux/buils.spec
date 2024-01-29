Name: morio-client
Version: 0.0.1
Release: 0%{?dist}
Summary: Morio is a streaming data platform by CERT-EU.
License: MIT
URL: https://github.com/certeu/morio
Requires: auditbeat
Requires: filebeat
Requires: metricbeat

%description
Morio allows you to connect your systems, ingest their logs, metrics
and audit info, and do stream processing and analysis in real time.

This is the Morio client, which provides the agents to ingest your data into Morio.

Documentation: https://github.com/certeu/morio

%install
mkdir -p %{buildroot}/etc/morio/
mkdir -p %{buildroot}/usr/sbin/
cp -R %{_sourcedir}/etc/morio %{buildroot}/etc/
cp %{_sourcedir}/usr/sbin/morio-* %{buildroot}/usr/sbin
echo %{name}-%{version}-%{release}.%{_arch}
# With systemd
mkdir -p %{buildroot}/etc/systemd/system/
cp -R %{_sourcedir}/etc/systemd/system/morio-* %{buildroot}/etc/systemd/system
# Without systemd
mkdir -p %{buildroot}/etc/rc.d/init.d
cp -R %{_sourcedir}/etc/rc.d/init.d/morio-* %{buildroot}/etc/rc.d/init.d

%files
/usr/sbin/morio
/usr/sbin/morio-audit
/usr/sbin/morio-logs
/usr/sbin/morio-metrics
/usr/sbin/morio-restart
/usr/sbin/morio-start
/usr/sbin/morio-stop
/etc/systemd/system/morio-audit.service
/etc/systemd/system/morio-logs.service
/etc/systemd/system/morio-metrics.service
/etc/rc.d/init.d/morio-audit
/etc/rc.d/init.d/morio-logs
/etc/rc.d/init.d/morio-metrics
/etc/client/ca.pem
#/etc/client/client.key
#/etc/client/client.pem
/etc/client/audit/config.yml
/etc/client/audit/modules.d/system.yml
/etc/client/logs/config.yml
/etc/client/logs/inputs.d/linux-system.yml
/etc/client/logs/inputs.d/linux-morio-client.yml
/etc/client/logs/modules.d/linux-system.yml
/etc/client/metrics/config.yml
/etc/client/metrics/modules.d/linux-morio-client.yml
/etc/client/metrics/modules.d/linux-system.yml

%clean
rm -rf %{buildroot}

%post

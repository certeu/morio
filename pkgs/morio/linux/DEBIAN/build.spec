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

Documentation: https://morio.it

%install
mkdir -p %{buildroot}/etc/morio/
mkdir -p %{buildroot}/usr/sbin/
cp -R %{_sourcedir}/etc/morio %{buildroot}/etc/
cp %{_sourcedir}/usr/sbin/morio-* %{buildroot}/usr/sbin
echo %{name}-%{version}-%{release}.%{_arch}
mkdir -p %{buildroot}/etc/systemd/system/
cp -R %{_sourcedir}/etc/systemd/system/morio-* %{buildroot}/etc/systemd/system

%files
/usr/sbin/morio
/etc/systemd/system/morio-audit.service
/etc/systemd/system/morio-logs.service
/etc/systemd/system/morio-listener.service
/etc/systemd/system/morio-metrics.service
/etc/morio/audit/config.yml
/etc/morio/logs/config.yml
/etc/morio/metrics/config.yml
/etc/morio/morio.yml

%clean
rm -rf %{buildroot}

%post

package com.fitflow.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeTimer")
public class NativeTimerPlugin extends Plugin {

    private static final String CHANNEL_ID = "fitflow-live-timer";

    private void ensureChannel(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm.getNotificationChannel(CHANNEL_ID) != null) return;
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID, "Cronômetros do treino", NotificationManager.IMPORTANCE_LOW);
        channel.setDescription("Mostra o descanso e o tempo de treino na tela de bloqueio");
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        channel.setShowBadge(false);
        nm.createNotificationChannel(channel);
    }

        @SuppressLint("MissingPermission")
    @PluginMethod
    public void show(PluginCall call) {
        Context ctx = getContext();

        if (Build.VERSION.SDK_INT >= 33
                && ctx.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            call.resolve();
            return;
        }

        int id = call.getData().optInt("id", -1);
        long when = call.getData().optLong("when", 0);
        if (id < 0 || when <= 0) {
            call.reject("Faltam dados do cronômetro");
            return;
        }
        String title = call.getString("title", "FitFlow");
        String text = call.getString("text", "");
        boolean countDown = call.getData().optBoolean("countDown", false);

        ensureChannel(ctx);

        Intent open = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        PendingIntent pending = PendingIntent.getActivity(
                ctx, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(ctx, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title)
                .setContentText(text)
                .setContentIntent(pending)
                .setWhen(when)
                .setShowWhen(true)
                .setUsesChronometer(true)
                .setChronometerCountDown(countDown)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_PROGRESS)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC);

        if (countDown) {
            // Some sozinha pouco depois de chegar a zero
            long remaining = when - System.currentTimeMillis();
            builder.setTimeoutAfter(Math.max(1000, remaining + 1500));
        }

        NotificationManagerCompat.from(ctx).notify(id, builder.build());
        call.resolve();
    }

    @PluginMethod
    public void hide(PluginCall call) {
        Integer id = call.getInt("id");
        if (id != null) {
            NotificationManagerCompat.from(getContext()).cancel(id);
        }
        call.resolve();
    }
}
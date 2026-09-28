import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession, compareSecret, hashSecret, recordAudit } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    const body = await req.json();
    const { email, currentPassword, newPassword } = body;

    const targetEmail = session?.email || email;

    if (!targetEmail || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios (correo, contraseña actual y nueva contraseña).' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe tener al menos 6 caracteres.' },
        { status: 400 }
      );
    }

    const user = await db.user.findFirst({
      where: {
        email: { equals: targetEmail.trim(), mode: 'insensitive' },
        estado: 'ACTIVO',
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o sin acceso administrativo.' },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentValid = await compareSecret(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: 'La contraseña actual no es correcta.' },
        { status: 401 }
      );
    }

    // Hash and update to new password
    const newPasswordHash = await hashSecret(newPassword);

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Record audit event
    await recordAudit({
      usuarioId: user.id,
      rol: user.rol,
      accion: 'CAMBIO_PASSWORD',
      detalles: `El usuario ${user.nombre} (${user.email}) cambió su contraseña de acceso exitosamente.`,
    });

    return NextResponse.json({
      success: true,
      message: '¡Contraseña actualizada exitosamente! Recuerda usar tu nueva clave en tu próximo inicio de sesión.',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Error al cambiar la contraseña en el servidor.' },
      { status: 500 }
    );
  }
}
